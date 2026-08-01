import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';

const originUrl = 'http://127.0.0.1:4324';
const siteBasePath = process.env.SITE_BASE_PATH || '/';
const normalizedBasePath =
  siteBasePath === '/' ? '/' : `/${siteBasePath.replace(/^\/+|\/+$/g, '')}/`;
const reportDir = path.resolve('reports/lighthouse');
const lighthouseCli = path.resolve('node_modules/lighthouse/cli/index.js');

const routes = ['/', '/products/200-011-00001/', '/departments/weapons/', '/support/search/?s=laser', '/shopping-cart/'];

const budgets = {
  performance: 0.9,
  accessibility: 1,
  'best-practices': 1,
  seo: 1,
};

const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const routeWithBase = (route) =>
  `${normalizedBasePath}${route === '/' ? '' : route.replace(/^\/+/, '')}`;

const terminateProcess = (child, signal) => {
  if (!child.pid || child.exitCode !== null) return;

  try {
    process.kill(-child.pid, signal);
  } catch {
    child.kill(signal);
  }
};

const waitForClose = (child) =>
  new Promise((resolve) => {
    if (child.exitCode !== null || child.signalCode !== null) {
      resolve();
      return;
    }

    child.once('close', resolve);
  });

const run = (command, args, options = {}) =>
  new Promise((resolve, reject) => {
    const { capture, timeoutMs, ...spawnOptions } = options;
    const child = spawn(command, args, { stdio: capture ? ['ignore', 'pipe', 'pipe'] : 'inherit', ...spawnOptions });
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    const timeout = timeoutMs
      ? setTimeout(() => {
          timedOut = true;
          terminateProcess(child, 'SIGTERM');
          setTimeout(() => terminateProcess(child, 'SIGKILL'), 5_000).unref();
        }, timeoutMs)
      : null;

    if (capture) {
      child.stdout.on('data', (chunk) => {
        stdout += chunk;
      });
      child.stderr.on('data', (chunk) => {
        stderr += chunk;
      });
    }

    child.on('error', reject);
    child.on('close', (code) => {
      if (timeout) clearTimeout(timeout);
      if (timedOut) {
        reject(new Error(`${command} ${args.join(' ')} timed out after ${timeoutMs}ms\n${stderr}`));
        return;
      }

      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(`${command} ${args.join(' ')} exited with ${code}\n${stderr}`));
      }
    });
  });

const waitForServer = async () => {
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(new URL(normalizedBasePath, originUrl));
      if (response.ok) return;
    } catch {
      // Preview server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`Timed out waiting for ${new URL(normalizedBasePath, originUrl).toString()}`);
};

const slugForRoute = (route) => {
  const url = new URL(routeWithBase(route), originUrl);
  const slug = `${url.pathname}${url.search}`.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'home';
  return slug.toLowerCase();
};

await fs.mkdir(reportDir, { recursive: true });
await run('npm', ['run', 'prod']);

const preview = spawn('npm', ['run', 'preview', '--', '--host', '127.0.0.1', '--port', '4324'], {
  detached: true,
  stdio: ['ignore', 'pipe', 'pipe'],
});

try {
  await waitForServer();
  const failures = [];

  for (const route of routes) {
    const url = new URL(routeWithBase(route), originUrl).toString();
    console.log(`Auditing ${url}`);
    const { stdout } = await run(
      process.execPath,
      [
        lighthouseCli,
        url,
        '--quiet',
        '--preset=desktop',
        '--output=json',
        '--output-path=stdout',
        '--chrome-flags=--headless=new --no-sandbox',
        '--only-categories=performance,accessibility,best-practices,seo',
      ],
      { capture: true, detached: true, timeoutMs: 90_000 }
    );

    const report = JSON.parse(stdout);
    await fs.writeFile(path.join(reportDir, `${slugForRoute(route)}.json`), `${JSON.stringify(report, null, 2)}\n`);

    const scores = Object.fromEntries(
      Object.entries(report.categories).map(([category, value]) => [category, value.score])
    );

    for (const [category, minimum] of Object.entries(budgets)) {
      if (scores[category] < minimum) {
        failures.push(`${route} ${category}: ${scores[category]} below ${minimum}`);
      }
    }

    console.log(
      `${route} performance=${Math.round(scores.performance * 100)} accessibility=${Math.round(
        scores.accessibility * 100
      )} best-practices=${Math.round(scores['best-practices'] * 100)} seo=${Math.round(scores.seo * 100)}`
    );
  }

  if (failures.length > 0) {
    throw new Error(`Lighthouse budgets failed:\n${failures.join('\n')}`);
  }
} finally {
  terminateProcess(preview, 'SIGTERM');
  const closed = await Promise.race([waitForClose(preview).then(() => true), delay(5_000).then(() => false)]);
  if (!closed) {
    terminateProcess(preview, 'SIGKILL');
    await waitForClose(preview);
  }
}

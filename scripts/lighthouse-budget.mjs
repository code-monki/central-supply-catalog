import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';

const baseUrl = 'http://127.0.0.1:4324';
const reportDir = path.resolve('reports/lighthouse');
const lighthouseCli = path.resolve('node_modules/lighthouse/cli/index.js');

const routes = ['/', '/products/200-011-00001/', '/departments/weapons/', '/support/search/?s=laser', '/shopping-cart/'];

const budgets = {
  performance: 0.9,
  accessibility: 1,
  'best-practices': 1,
  seo: 1,
};

const run = (command, args, options = {}) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: options.capture ? ['ignore', 'pipe', 'pipe'] : 'inherit', ...options });
    let stdout = '';
    let stderr = '';

    if (options.capture) {
      child.stdout.on('data', (chunk) => {
        stdout += chunk;
      });
      child.stderr.on('data', (chunk) => {
        stderr += chunk;
      });
    }

    child.on('error', reject);
    child.on('close', (code) => {
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
      const response = await fetch(baseUrl);
      if (response.ok) return;
    } catch {
      // Preview server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`Timed out waiting for ${baseUrl}`);
};

const slugForRoute = (route) => {
  const url = new URL(route, baseUrl);
  const slug = `${url.pathname}${url.search}`.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'home';
  return slug.toLowerCase();
};

await fs.mkdir(reportDir, { recursive: true });
await run('npm', ['run', 'prod']);

const preview = spawn('npm', ['run', 'preview', '--', '--host', '127.0.0.1', '--port', '4324'], {
  stdio: ['ignore', 'pipe', 'pipe'],
});

try {
  await waitForServer();
  const failures = [];

  for (const route of routes) {
    const url = new URL(route, baseUrl).toString();
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
      { capture: true }
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
  preview.kill('SIGTERM');
}

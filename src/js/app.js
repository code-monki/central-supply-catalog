const APP = {
  SW: null,
  init() {
    // register the service worker
    APP.registerSW();
  },
  registerSW() {
    const swName = `${window.location.protocol}//${window.location.hostname}:${window.location.port}/sw.js`
    console.log(swName);
    if ("serviceWorker" in navigator) {
      // register the service worker hosted at the root of the site
      navigator.serviceWorker.register(swName).then(
        (registration) => {
          APP.SW = registration.installing || registration.waiting || registration.active;
        },
        (error) => {
          console.log("Service worker registration failed");
        }
      );
    } else {
      console.log("Service workers are not supported.");
    }
  },
};

document.addEventListener('DOMContentLoaded', APP.init);

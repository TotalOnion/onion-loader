/* eslint-disable no-use-before-define */
/* eslint-disable no-console */

//*** Lazyloader ***//

/**
 * The options object for the lazyloader.
 * @type {object}
 * @property {string} rootMargin The root margin for the IntersectionObserver.
 * @default '0% 0% 0%'
 * @property {number} threshold The threshold for the IntersectionObserver.
 * @property {boolean} debugLogMessages Whether to log debug messages.
 * @property {array} lazyBlocksToSearchFor The array of lazy blocks to search for.
 * @property {array} lazyBlocksFound The array of lazy blocks found.
 * @property {array} assetArray The array of assets to load.
 * @property {object} assetMap The asset map object.
 * @property {boolean} ignoreCss Whether to ignore the css.
 * @property {boolean} lazy Whether to lazy load the assets (after Assets alias).
 * @property {string} filePath The file path for the js assets.
 * @default 'js/blocks/'
 * @property {string} filePathCss The file path for the css assets (after Assets alias).
 * @default 'scss/blocks/'
 */

const fallbackAssetArray = [
  { assetKey: "back-to-top-button" },
  { assetKey: "group-container-v3" },
  { assetKey: "standard-content-v3" },
  { assetKey: "single-responsive-image-v3" },
  { assetKey: "site-logo-container-v3" },
];

const options = {
  rootMargin: "100% 0px 300px 0px",
  threshold: 0,
  debugLogMessages: true,
  lazyBlocksToSearchFor: [],
  lazyBlocksFound: [],
  assetArray: fallbackAssetArray,
  assetMap: {},
  css: true,
  lazy: true,
  cssLoadingStyle: "bundle", // 'component' or 'bundle'
  filePrefix: "nodemodules", //'nodemodules', 'assets' or 'dev'
  fileSuffixJs: ".js",
  fileSuffixCss: ".scss",
  filePath: "js/blocks",
  filePathCss: "scss/blocks",
};

/**
 * Initializes the lazyloader.
 */
function lazyloaderInit() {
  options.debugLogMessages && console.log("Lazy Loader initialized!");
  options.lazyBlocksToSearchFor = [];
  options.assetArray.forEach((asset) => {
    if (options.filePrefix === "nodemodules") {
      options.assetMap[asset.assetKey] = {
        js: () =>
          import(
            `NodeModules/@total_onion/onion-library/components/block-${asset.assetKey}/${asset.assetKey}${options.fileSuffixJs}`
          ),
        css: options.ignoreCss === true,
      };
    }
    if (options.filePrefix === "assets") {
      options.assetMap[asset.assetKey] = {
        js: () => import(`Assets/${this.options.filePath}/${asset.assetKey}`),
        css: options.ignoreCss === false,
      };
    }

    // if (options.filePrefix === "dev") {
    //   options.assetMap[asset.assetKey] = {
    //     js: () =>
    //       import(
    //         `../../../../../../../../onion-library/components/block-${asset.assetKey}/${asset.assetKey}${options.fileSuffixJs}`
    //       ),
    //     css: options.ignoreCss === true,
    //   };
    // }

    // Add to lazy blocks to search for
    options.lazyBlocksToSearchFor.push(`[data-assetkey="${asset.assetKey}"]`);
    options.lazyBlocksFound = Array.from(
      document.querySelectorAll(options.lazyBlocksToSearchFor)
    );
  });

  // If data eager loading attribute is true - load js straight away
  options.lazyBlocksFound.forEach((block) => {
    if (block.dataset.eager == "true") {
      callBlockJs(block);
    }
  });

  options.debugLogMessages && console.log("Lazyloader Options", options);

  // Check if the browser has intersection observer which is needed for the Lazyloader or if all assets should load immediately anyway.
  if (options.lazy === false || !("IntersectionObserver" in window)) {
    options.debugLogMessages && console.log("running eager loading");
    try {
      options.lazyBlocksFound.forEach((block) => {
        callBlockJs(block);
      });
    } catch (error) {
      console.log(error);
    }
  } else {
    options.debugLogMessages && console.log("running normal process");
    observerInit(options.lazyBlocksFound);
  }
}

/**
 * Initializes the IntersectionObserver for the lazy loading of blocks.
 * @param {array} elementsToObserve The array of block elements to observe.
 */
function observerInit(elementsToObserve = []) {
  const observer = new IntersectionObserver(intersectionCallback, options);
  elementsToObserve.forEach((element) => {
    if (element) {
      observer.observe(element);
    }
  });
}

/**
 * Callback function for the IntersectionObserver.
 * @param {array} entries The entries array from the IntersectionObserver.
 * @param {object} observer The IntersectionObserver object.
 */
const intersectionCallback = (entries, observer) => {
  options.debugLogMessages && console.log("Observer entries", entries);
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      const lazyTarget = entry.target;
      try {
        callBlockJs(lazyTarget);
      } catch (error) {
        console.log(
          error,
          "block data assetkey:",
          lazyTarget.dataset.assetkey,
          " - ",
          "asset import function:",
          options.assetMap[lazyTarget.dataset.assetkey],
          "are you missing an asset key or import function?"
        );
      }
      observer.unobserve(lazyTarget);
      options.debugLogMessages &&
        console.log("Unobserving lazyElement", lazyTarget);
    }
  });
};

/**
 * Calls the block asset functions and adds the loaded class to the block.
 * @param {object} block The block element.
 */
function callBlockJs(block) {
  if (!block.classList.contains("loaded")) {
    Promise.all([
      options.assetMap[block.dataset.assetkey].js(),
      loadCss(block.dataset.assetkey),
    ]).then((module) => {
      try {
        if (block.dataset.jsload !== "false") {
          module[0].default({
            block,
            css: false,
          });
        } else {
          options.debugLogMessages &&
            console.log(
              `Skipping JS load for block: ${block.dataset.assetkey}`
            );
        }
        block.classList.add("loaded");
      } catch (error) {
        console.log("could not load block js", error);
      }
    });
  }
}

/**
 * Checks to see if the css for the block has already been included in the 'criticalconfig' window object.
 * Will return true if it is.
 * @param {string} assetKey The assetkey string of the block.
 * @returns {boolean}
 */
export function inCriticalCssConfig(assetKey) {
  if (!globalThis.criticalConfig) {
    return false;
  }
  if (
    globalThis.criticalConfig &&
    globalThis.criticalConfig.indexOf(assetKey) === -1
  ) {
    return false;
  }
  return true;
}

/**
 * Dynamically loads the css for the block if it has not already been included in critical css or the css property is set to false.
 * @param {string} assetKey The assetkey string of the block.
 * @param {object} options The options object which will at the very least contain the css property set to true.
 * @returns {promise}
 */
export function loadCss(assetKey) {
  if (options.css == true && options.cssLoadingStyle === "bundle") {
    options.debugLogMessages && console.log("using css bundle");
    const promise = new Promise((resolve) => {
      import(
        `NodeModules/@total_onion/onion-library/public/publicbundlecss.css`
      ).then(() => {
        console.log("resolved");
        resolve(true);
      });
    });
    return promise;
  }
  if (options.css == true && options.cssLoadingStyle === "component") {
    options.debugLogMessages && console.log("using individual css");
    const promise = new Promise((resolve) => {
      if (options.css === true && !inCriticalCssConfig(assetKey)) {
        import(
          /* webpackChunkName: "[request]" */ `NodeModules/@total_onion/onion-library/components/block-${assetKey}${options.fileSuffixCss}`
        ).then(() => resolve(true));
      } else {
        return resolve(true);
      }
    });
  }
}

const api = {
  lazyloaderInit,
  options,
};

export default api;

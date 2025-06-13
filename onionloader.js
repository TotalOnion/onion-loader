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

const fallbackAssetArray = [{ assetKey: "back-to-top-button" }];

const options = {
  rootMargin: "0% 0% 0%",
  threshold: 0,
  debugLogMessages: true,
  lazyBlocksToSearchFor: [],
  lazyBlocksFound: [],
  assetArray: fallbackAssetArray,
  assetMap: {},
  css: true,
  lazy: true,
  filePrefix: "DevLibrary",
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
    if (options.filePrefix === "DevLibrary") {
      options.assetMap[asset.assetKey] = {
        js: () =>
          import(
            `DevLibrary/block-${asset.assetKey}/${asset.assetKey}${options.fileSuffixJs}`
          ),
        css: options.css === true,
      };
    }
    // if (options.filePrefix === "NodeModules") {
    //   options.assetMap[asset.assetKey] = {
    //     js: () => import(`NodeModules/${this.options.filePath}/${asset.assetKey}/${asset.assetKey}${options.fileSuffixJs}`),
    //     css: options.ignoreCss === true,
    //   };
    // }

    // if not, add to lazy blocks to search for
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
    block.classList.add("loaded");
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
  // const promise = new Promise((resolve) => {
  //   if (options.css === true && !inCriticalCssConfig(assetKey)) {
  //     import(
  //       /* webpackChunkName: "[request]" */ `DevLibrary/${options.filePathCss}/${assetKey}${options.fileSuffixCss}`
  //     ).then(() => resolve(true));
  //   } else {
  //     return resolve(true);
  //   }
  // });
  // return promise;
}

const api = {
  lazyloaderInit,
  options,
};

export default api;

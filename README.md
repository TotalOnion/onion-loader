# Onion Loader 

The Onion Loader is a tool that uses intersection observer to dynamically load css and javascript.

## How to get started

Install Onion Loader with NPM.

    npm i TotalOnion/Onion Loader

Import the module in your js file. The module uses a default export so you can reference with whatever name you like in your file.

    import lazyloader from 'TotalOnion/Onion Loader';

However, we have not yet given it anything to look for. To do this we need to pass it an array of objects called each of which needs at least one key value pair of the form:

    [{'assetKey' : <string>}]

For the lazyloader to find anything on the screen that it can load assets for, the html element needs to have the assetkey added as a data-attribute. eg:

    <section class="some-element" data-assetkey="<string>">

The string in the data attribute must match the string value of the object we are going to pass to the lazyloader. The assets that the lazyloader will look for will also need to have the same name as the assetkey. Eg.
    `<string>`.js
    or
    `<string>`.scss>

Finally we can send the names to the lazyloader by updating it's options object. Eg.

    lazyloader.options.assetArray = [{'assetKey' : <string>}];

The lazyloader will be looking for js files in a specific folder which it will run when the corresponding elements have become visible in the browser. The folder path is prefixed with an alias which is 'Assets'. This alias needs to be created in your bundler and the folder accessible via this alias. You can add additional file path structure to the alias by specifying the extra structure in the filepath option. eg:

    lazyloader.options.filepath = 'js/blocks/';

Which will give you a combined path of: 

    'Assets/js/blocks/'

Lastly summon an instance of the lazyloader in your js with the lazyloaderInit() method.

    lazyloader.lazyloaderInit();

The lazyloader should now be up and running and looking for things to lazyload!

For some helpful messages and some indication that the module is working, try changing the debugLogMessages option to true in your js file. Just make sure to set the option before invoking the lazyloaderInit() method.

    lazyloader.options.debugLogMessages = true;
    lazyloader.lazyloaderInit();

## Options, overrides and defaults

The current default settings for the lazyloader are as follows.

    const options = {
        rootMargin: '0% 0% 0%',
        threshold: 0,
        debugLogMessages: false,
        lazyBlocksToSearchFor: [],
        lazyBlocksFound: [],
        assetArray: [],
        assetMap: {},
        ignoreCss: false,
        lazy: true,
        filePath: 'js/components/blocks/',
    };

note: the filepath is currently prefixed with the webpack alias 'Assets'. You would need to be able set this alias in your bundler for the lazyloader to work. The filePath is itself optional so you can use just the alias.
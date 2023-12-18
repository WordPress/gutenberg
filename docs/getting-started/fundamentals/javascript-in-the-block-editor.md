# Working with Javascript for the Block Editor

A JavaScript Build Process is recommended for most cases when working with Javascript for the Block Editor. With a build process, you'll be able to work with ESNext and JSX (among others) syntaxes and features in your code while producing code ready for the majority of the browsers.

## JavaScript Build Process

["ESNext"](https://developer.mozilla.org/en-US/docs/Web/JavaScript/JavaScript_technologies_overview#standardization_process) is a dynamic name that refers to Javascript's latest syntax and features. ["JSX"](https://react.dev/learn/writing-markup-with-jsx) is a custom syntax extension to JavaScript, created by React project, that allows you to write JavaScript using a familiar HTML tag-like syntax.

Browsers cannot interpret or run ESNext and JSX syntaxes, so a transformation step is needed to convert these syntaxes to code that browsers can understand.

["webpack"](https://webpack.js.org/concepts/why-webpack/) is a pluggable tool that processes JavaScript and creates a compiled bundle that runs in a browser. ["babel"](https://babeljs.io/) transforms JavaScript from one format to another. Babel is a webpack plugin to transform ESNext and JSX to production-ready JavaScript.

[`@wordpress/scripts`](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-scripts/) package abstracts these libraries away to standardize and simplify development, so you won’t need to handle the details for configuring webpack or babel. Check the [Get started with wp-scripts](https://developer.wordpress.org/block-editor/getting-started/devenv/get-started-with-wp-scripts/) intro guide.


Among other things, with `wp-scripts` package you can use Javascript modules to distribute your code among different files and get a few bundled files at the end of the build process (see [example](https://github.com/WordPress/block-development-examples/tree/trunk/plugins/data-basics-59c8f8)).

[![Open Build Process diagram image](https://developer.wordpress.org/files/2023/11/build-process.png)](https://developer.wordpress.org/files/2023/11/build-process.png "Open Build Process diagram image")

With the [proper `package.json` scripts](https://developer.wordpress.org/block-editor/getting-started/devenv/get-started-with-wp-scripts/#basic-usage) you can launch the build process with `wp-scripts` in production and development mode:

- **`npm run build` for "production" mode build** - This process [minifies the code](https://developer.mozilla.org/en-US/docs/Glossary/Minification) so it downloads faster in the browser. 
- **`npm run start` for "development" mode build**  - This process does not minify the code of the bundled files, provides [source maps files](https://firefox-source-docs.mozilla.org/devtools-user/debugger/how_to/use_a_source_map/index.html) for them, and additionally continues a running process to watch the source file for more changes and rebuilds as you develop.

<div class="callout callout-tip">
    You can <a href="https://developer.wordpress.org/block-editor/reference-guides/packages/packages-scripts/#provide-your-own-webpack-config">provide your own custom <code>webpack.config.js</code></a> to <code>wp-scripts</code> to customize the build process to suit your needs 
</div>

## Javascript without a build process

Using Javascript without a build process may be another good option for code developments with few requirements (especially those not requiring JSX). 

Without a build process, you access the methods directly from the `wp` global object and must enqueue the script manually. [WordPress Javascript packages](https://developer.wordpress.org/block-editor/reference-guides/packages/) can be accessed through the `wp` [global variable](https://developer.mozilla.org/en-US/docs/Glossary/Global_variable) but every script that wants to use them through this `wp` object is responsible for adding [the handle of that package](https://developer.wordpress.org/block-editor/contributors/code/scripts/) to the dependency array when registered.

So, for example if a script wants to register a block variation using the `registerBlockVariation` method out of the ["blocks" package](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-blocks/), the `wp-blocks` handle would need to get added to the dependency array to ensure that `wp.blocks.registerBlockVariation` is defined when the script tries to access it (see [example](https://github.com/wptrainingteam/block-theme-examples/blob/master/example-block-variation/functions.php)). 

<div class="callout callout-tip">
    Try running <code>wp.data.select('core/editor').getBlocks())</code> in your browser's dev tools while editing a post or a site. The entire editor is available from the console.
</div>

Use [`enqueue_block_editor_assets`](https://developer.wordpress.org/reference/hooks/enqueue_block_editor_assets/) hook coupled with the standard [`wp_enqueue_script`](https://developer.wordpress.org/reference/functions/wp_enqueue_script/) (and [`wp_register_script`](https://developer.wordpress.org/reference/functions/wp_register_script/)) to enqueue javascript assets for the Editor with access to these packages via `wp` (see [example](https://github.com/wptrainingteam/block-theme-examples/tree/master/example-block-variation)). Refer to [Enqueueing assets in the Editor](https://developer.wordpress.org/block-editor/how-to-guides/enqueueing-assets-in-the-editor/) for more info.

## Additional resources

- [Get started with wp-scripts](https://developer.wordpress.org/block-editor/getting-started/devenv/get-started-with-wp-scripts/) 
- [Enqueueing assets in the Editor](https://developer.wordpress.org/block-editor/how-to-guides/enqueueing-assets-in-the-editor/) 
- [WordPress Packages handles](https://developer.wordpress.org/block-editor/contributors/code/scripts/) 
- [Javascript Reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript) | MDN Web Docs
- [block-development-examples](https://github.com/WordPress/block-development-examples) | GitHub repository
- [block-theme-examples](https://github.com/wptrainingteam/block-theme-examples) | GitHub repository
- [How webpack and WordPress packages interact](https://developer.wordpress.org/news/2023/04/how-webpack-and-wordpress-packages-interact/) | Developer Blog
- [Build Process Diagram](https://excalidraw.com/#json=4aNG9JUti3pMnsfoga35b,ihEAI8p5dwkpjWr6gQmjuw)

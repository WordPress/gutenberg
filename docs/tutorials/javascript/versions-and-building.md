# JavaScript Versions and Build Step

The Gutenberg Handbook shows JavaScript examples in two syntaxes: ES5 and ESNext. These are version names for the JavaScript language standard definitions. You may also see elsewhere the names ES6, or ECMAScript 2015 mentioned. See the [ECMAScript](https://en.wikipedia.org/wiki/ECMAScript) Wikipedia article for all the details.

ES5 code is compatible with WordPress's minimum [target for browser support](https://make.wordpress.org/core/handbook/best-practices/browser-support/).

"ESNext" doesn't refer to a specific version of JavaScript, but is "dynamic" and refers to the next language definitions, whatever they might be. Because some browsers won't support these features yet (because they're new or proposed), an extra build step is required to transform the code to a syntax that works in all browsers. Webpack and babel are the tools that perform this transformation step.

Additionally, the ESNext code examples in the Gutenberg handbook include [JSX syntax](https://reactjs.org/docs/introducing-jsx.html), a syntax that blends HTML and JavaScript. It makes it easier to read and write markup code, but likewise requires the build step using Webpack and Babel to transform into compatible code.

For simplicity, the JavaScript tutorial uses the ES5 definition, without JSX. This code can run straight in your browser and does not require an additional build step. In many cases, it will be perfectly fine to follow the same approach to quickly start experimenting with your plugin or theme. As soon as your codebase grows to hundreds of lines it might be a good idea to get familiar with the [JavaScript Build Setup documentation](/docs/tutorials/javascript/js-build-setup.md) for setting up a development environment to use ESNext syntax.


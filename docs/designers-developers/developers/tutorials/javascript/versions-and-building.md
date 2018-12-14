# JavaScript versions and build step

The Gutenberg Handbook shows JavaScript examples in two syntaxes ES5 and ESNext. These are version names for the JavaScript language standard definitions. You may also see elsewhere the versions ES6, or ECMAScript 2015 mentioned. Ses the [ECMAScript](https://en.wikipedia.org/wiki/ECMAScript) Wikipedia article for all the details.

ES5 code is compatible with WordPress's minimum [target for browser support](https://make.wordpress.org/core/handbook/best-practices/browser-support/).

For this tutorial, all examples are written compatible to ES5 definition of JavaScript. This code can be run straight in your browser and does not require an additional build step.

The ESNext version is dynamic and refers to the next language definitions, which will always be ahead of browser support. An extra build step is required to transform the code to a syntax that works in all browsers. Webpack and babel are the tools that perform this transformation step.

Additionally, the ESNext code examples in the Gutenberg handbook include [JSX syntax](https://reactjs.org/docs/introducing-jsx.html), which is easier to read and write, but likewise requires the build step using webpack and babel to transform into compatible code.


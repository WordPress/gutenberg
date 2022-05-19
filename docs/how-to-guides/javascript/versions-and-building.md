# JavaScript Versions and Build Step

The Block Editor Handbook shows JavaScript examples in two syntaxes: JSX and Plain.

Plain refers to JavaScript code compatible with WordPress's minimum [target for browser support](https://make.wordpress.org/core/handbook/best-practices/browser-support/) without requiring a transpilation step. This step is commonly referred to as a build process.

"JSX" doesn't refer to a specific version of JavaScript, but refers to the latest language definition plus
[JSX syntax](https://reactjs.org/docs/introducing-jsx.html), a syntax that blends HTML and JavaScript. JSX makes it easier to read and write markup code, but does require a build step to transpile into code compatible with browers. Webpack and babel are the tools that perform this transpilation step.

For simplicity, the JavaScript tutorial uses the Plain definition, without JSX. This code can run straight in your browser and does not require an additional build step. In many cases, it is perfectly fine to follow the same approach for simple plugins or experimenting. As your codebase grows in complexity it might be a good idea to switch to JSX. You will find the majority of code and documentation across the block editor uses JSX.

See the [JavaScript Build Setup documentation](/docs/how-to-guides/javascript/js-build-setup.md) for setting up a development environment using JSX syntax.

See the [ESNext syntax documentation](/docs/how-to-guides/javascript/esnext-js.md) for explanation and examples about common code differences between standard JavaScript and more modern approaches.

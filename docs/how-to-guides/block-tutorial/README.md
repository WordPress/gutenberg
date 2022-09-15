# Blocks

The purpose of this tutorial is to step through the fundamentals of creating a new block type. Beginning with the simplest possible example, each new section will incrementally build upon the last to include more of the common functionality you could expect to need when implementing your own block types.

To follow along with this tutorial, you can [download the accompanying WordPress plugin](https://github.com/WordPress/gutenberg-examples) which includes all of the examples for you to try on your own site. At each step along the way, experiment by modifying the examples with your own ideas, and observe the effects they have on the block's behavior.

Code snippets are provided in two formats "JSX" and "Plain". JSX refers to JavaScript code that uses JSX syntax which requires a build step. Plain refers to "classic" JavaScript that does not require building. You can change between them using tabs found above each code example. Using JSX, does require you to run [the JavaScript build step](/docs/how-to-guides/javascript/js-build-setup/) to compile your code to a browser compatible format.

Note that it is not required to use JSX to create blocks or extend the editor, you can use classic JavaScript. However, once familiar with JSX and the build step, many developers tend to find it is easier to read and write, thus most code examples you'll find use the JSX syntax.

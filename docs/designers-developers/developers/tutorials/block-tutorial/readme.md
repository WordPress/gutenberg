# Blocks

The purpose of this tutorial is to step through the fundamentals of creating a new block type. Beginning with the simplest possible example, each new section will incrementally build upon the last to include more of the common functionality you could expect to need when implementing your own block types.

To follow along with this tutorial, you can [download the accompanying WordPress plugin](https://github.com/WordPress/gutenberg-examples) which includes all of the examples for you to try on your own site. At each step along the way, experiment by modifying the examples with your own ideas, and observe the effects they have on the block's behavior.

Code snippets are provided in two formats "ES5" and "ESNext". ES5 refers to "classic" JavaScript (ECMAScript 5), while ESNext refers to the next versions of the language standard, plus JSX syntax. You can change between them using tabs found above each code example. Using ESNext, does require you to run [the JavaScript build step](/docs/designers-developers/developers/tutorials/javascript/js-build-setup/) to compile your code to a browser compatible format.

Note that it is not required to use ESNext to create blocks or extend the editor, you can use classic JavaScript. However, once familiar with ESNext, developers find it is easier to read and write, thus most code examples you'll find use the ESNext syntax.

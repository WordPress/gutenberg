# Introduction to the Format API

The purpose of this tutorial is to introduce you to the Format API. The Format API makes it possible for developers to add custom buttons to the formatting toolbar and have them apply a _format_ to a text selection. Bold is an example of a standard button in the formatting toolbar.

In WordPress lingo, a _format_ is a [HTML tag with text-level semantics](https://www.w3.org/TR/html5/textlevel-semantics.html#text-level-semantics-usage-summary) used to give some special meaning to a text selection. For example, in this tutorial, the button to be hooked into the format toolbar will let users wrap a particular text selection with the [`<samp>` HTML tag](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/samp).

If you are unfamiliar with how to work with WordPress plugins and JavaScript, you may want to check the [JavaScript Tutorial](/docs/designers-developers/developers/tutorials/javascript/readme.md) first.

## Table of contents

1. [Register a new format](/docs/designers-developers/developers/tutorials/format-api/1-register-format.md)
2. [Add a button to the toolbar](/docs/designers-developers/developers/tutorials/format-api/2-toolbar-button.md)
3. [Apply the format when the button is clicked](/docs/designers-developers/developers/tutorials/format-api/3-apply-format.md)

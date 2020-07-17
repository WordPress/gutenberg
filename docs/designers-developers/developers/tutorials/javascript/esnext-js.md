# ESNext Syntax

The JavaScript language continues to evolve, the syntax used to write JavaScript code is not fixed but changes over time. [Ecma International](https://en.wikipedia.org/wiki/Ecma_International) is the organization that sets the standard for the language, officially called [ECMAScript](https://en.wikipedia.org/wiki/ECMAScript). A new standard for JavaScript is published each year, the 6th edition published in 2015 is often referred to as ES6. Our usage would more appropriately be **ESNext** referring to the latest standard. The build step is what converts this latest syntax of JavaScript to a version understood by browsers.

Here are some common ESNext syntax patterns used throughout the Gutenberg project.

## Destructuring Assignments

The [destructuring assignment](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment) syntax allows you to pull apart arrays, or properties from objects into their own variable.

For the object `const obj = { foo: "bar" }`

Creating and assigning a new variable `foo` can be done in a single step: `const { foo } = obj;`

The curly brackets on the left side tells JavaScript to inspect the object `obj` for the property `foo` and assign its value to the new variable of the same name.

## Arrow Functions

Arrow functions provide a shorter syntax for defining a function; this is such a common task in JavaScript that having a syntax a bit shorter is quite helpful.

Before you might define a function like:

```js
const f = function ( param ) {
	console.log( param );
};
```

Using arrow function, you can define the same using:

```js
const g = ( param ) => {
	console.log( param );
};
```

Or even shorter, if the function is only a single-line you can omit the
curly braces:

```js
const g2 = ( param ) => console.log( param );
```

In the examples above, using `console.log` we aren't too concerned about the return values. However, when using arrow functions in this way, the return value is set whatever the line returns.

For example, our save function could be shortened from:

```js
save: ( { attributes } ) => {
	return <div className="theurl">{ attributes.url }</div>;
};
```

To:

```js
save: ( { attributes } ) => <div className="theurl">{ attributes.url }</div>;
```

There are even more ways to shorten code, but you don't want to take it too far and make it harder to read what is going on.

## Imports

The [import statement](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import) is used to import variables or functions from an exported file. You can use destructuring on imports, for example:

```js
import { TextControl } from '@wordpress/components';
```

This will look in the `@wordpress/components` package for the exported `TextControl` variable.

A package or file can also set a `default` export, this is imported without using the curly brackets. For example

```js
const edit = ( { attributes, setAttributes } ) => {
    return (
        <div>
            <TextControl
                label="URL"
                value={ attributes.url }
                onChange={ ... }
            />
        </div>
    );
};

export default edit;
```

To import, you would use:

```js
import edit from './edit';

registerBlockType( 'mkaz/qrcode-block', {
	title: 'QRCode Block',
	icon: 'visibility',
	category: 'widgets',
	attributes: {
		url: {
			type: 'string',
			source: 'text',
			selector: '.theurl',
		},
	},
	edit,
	save: ( { attributes } ) => {
		return <div> ... </div>;
	},
} );
```

Note, you can also shorten `edit: edit` to just `edit` as shown above. JavaScript will automatically assign the property `edit` to the value of `edit`. This is another form of destructuring.

## Summary

It helps to become familiar with the ESNext syntax and the common shorter forms. It will give you a greater understanding of reading code examples and what is going on.

Here are a few more resources that may help

-   [ES5 vs ES6 with example code](https://medium.com/recraftrelic/es5-vs-es6-with-example-code-9901fa0136fc)
-   [Top 10 ES6 Features by Example](https://blog.pragmatists.com/top-10-es6-features-by-example-80ac878794bb)
-   [ES6 Syntax and Feature Overview](https://www.taniarascia.com/es6-syntax-and-feature-overview/)

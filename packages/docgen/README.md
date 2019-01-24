# `docgen`

`docgen` helps you to generate the _public API_ of your code. Given an entry point file, it outputs the ES6 export statements in the file with their corresponding JSDoc comments in human-readable format.

Some characteristics:

* If the export statement doesn't contain any JSDoc, it'll look up for JSDoc up to the declaration.
* It can resolve relative dependencies, either files or directories. For example, `import default from './dependency'` will find `dependency.js` or `dependency/index.js`

## Usage

`node src/cli.js <entry-point.js>`

This command will generate a file named `entry-point-api.md` containing all the exports and its JSDoc comments.

## Examples

### Default export

Entry point:

```js
/**
 * Adds two numbers.
 */
export default function addition( term1, term2 ) {
	// Implementation would go here.
}
```

Output:

```markdown

# API

## default

Adds two numbers.
```

### Named export

Entry point:

```js
/**
 * Adds two numbers.
 */
function addition( term1, term2 ) {
	// Implementation would go here.
}

export { count };
```

Output:

```markdown

# API

## count

Adds two numbers.
```

### Namespace export

Let `count/index.js` be:

```js
/**
 * Substracts two numbers.
 */
export function substraction( term1, term2 ) {
	// Implementation would go here.
}

/**
 * Adds two numbers.
 */
export function addition( term1, term2 ) {
	// Implementation would go here.
}
```

And the entry point:

```js
export * from './count';
```

Output would be:

```markdown
# API

## addition

Adds two numbers.

## substraction

Substracts two numbers.
```
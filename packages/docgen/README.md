# `docgen`

`docgen` helps you to generate the _public API_ of your code. Given an entry point file, it outputs the ES6 export statements and their corresponding JSDoc comments in human-readable format.

Some characteristics:

* If the export statement doesn't contain any JSDoc, it'll look up for JSDoc up to the declaration.
* It can resolve relative dependencies, either files or directories. For example, `import default from './dependency'` will find `dependency.js` or `dependency/index.js`

## Usage

`node src/cli.js <entry-point.js>`

This command will generate a file named `entry-point-api.md` containing all the exports and its JSDoc comments.

### CLI options

* **--formatter** `(String)`: An optional custom formatter to control the contents of the output file. It should be a CommonJS module that exports a function that takes as input:
  * *rootDir* `(String)`: current working directory as seen by docgen.
  * *docPath* `(String)`: path of the output document to generate.
  * *symbols* `(Array)`: the symbols found.
* **--ignore** `(RegExp)`: A regular expression used to ignore symbols whose name match it.
* **--output** `(String)`: Output file that will contain the API documentation.
* **--debug**: Run in debug mode, which outputs some intermediate files useful for debugging

## Examples

### Default export

Entry point:

```js
/**
 * Adds two numbers.
 *
 * @param {number} term1 First number.
 * @param {number} term2 Second number.
 * @return {number} The result of adding the two numbers.
 */
export default function addition( term1, term2 ) {
	// Implementation would go here.
}
```

Output:

```markdown
# API

## default

[example.js#L8-L10](example.js#L8-L10)

Adds two numbers.

**Parameters**

- **term1** `number`: First number.
- **term2** `number`: Second number.

**Returns**

`number` The result of adding the two numbers.
```

### Named export

Entry point:

```js
/**
 * Adds two numbers.
 *
 * @param {number} term1 First number.
 * @param {number} term2 Second number.
 * @return {number} The result of adding the two numbers.
 */
function addition( term1, term2 ) {
	return term1 + term2;
}

/**
 * Adds two numbers.
 *
 * @deprecated Use `addition` instead.
 *
 * @param {number} term1 First number.
 * @param {number} term2 Second number.
 * @return {number} The result of adding the two numbers.
 */
function count( term1, term2 ) {
	return term1 + term2;
}

export { count, addition };
```

Output:

```markdown
# API

## addition

[example.js#L25-L25](example.js#L25-L25)

Adds two numbers.

**Parameters**

- **term1** `number`: First number.
- **term2** `number`: Second number.

**Returns**

`number` The result of adding the two numbers.

## count

[example.js#L25-L25](example.js#L25-L25)

> **Deprecated** Use `addition` instead.

Adds two numbers.

**Parameters**

- **term1** `number`: First number.
- **term2** `number`: Second number.

**Returns**

`number` The result of adding the two numbers.
```

### Namespace export

Let the entry point be:

```js
export * from './count';
```

with `./count/index.js` contents being:

```js
/**
 * Substracts two numbers.
 *
 * @example
 *
 * ```js
 * const result = substraction( 5, 2 );
 * console.log( result ); // Will log 3
 * ```
 *
 * @param {number} term1 First number.
 * @param {number} term2 Second number.
 * @return {number} The result of subtracting the two numbers.
 */
export function substraction( term1, term2 ) {
	return term1 - term2;
}

/**
 * Adds two numbers.
 *
  * @example
 *
 * ```js
 * const result = addition( 5, 2 );
 * console.log( result ); // Will log 7
 * ```
 *
 * @param {number} term1 First number.
 * @param {number} term2 Second number.
 * @return {number} The result of adding the two numbers.
 */
export function addition( term1, term2 ) {
	// Implementation would go here.
	return term1 - term2;
}
```

Output would be:

````markdown
# API

## addition

[example-module.js#L1-L1](example-module.js#L1-L1)

Adds two numbers.

**Usage**

```js
const result = addition( 5, 2 );
console.log( result ); // Will log 7
```

**Parameters**

- **term1** `number`: First number.
- **term2** `number`: Second number.

**Returns**

`number` The result of adding the two numbers.

## substraction

[example-module.js#L1-L1](example-module.js#L1-L1)

Substracts two numbers.

**Usage**

```js
const result = substraction( 5, 2 );
console.log( result ); // Will log 3
```

**Parameters**

- **term1** `number`: First number.
- **term2** `number`: Second number.

**Returns**

`number` The result of subtracting the two numbers.
````
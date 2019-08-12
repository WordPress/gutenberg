# Avoid assigning variable values if unused before a return (no-unused-vars-before-return)

To avoid wastefully computing the result of a function call when assigning a variable value, the variable should be declared as late as possible. In practice, if a function includes an early return path, any variable declared prior to the `return` must be referenced at least once. Otherwise, in the condition which satisfies that return path, the declared variable is effectively considered dead code. This can have a performance impact when the logic performed in assigning the value is non-trivial.

## Rule details

Examples of **incorrect** code for this rule:

```js
function example( number ) {
	const foo = doSomeCostlyOperation();
	if ( number > 10 ) {
		return number + 1;
	}

	return number + foo;
}
```

Examples of **correct** code for this rule:

```js
function example( number ) {
	if ( number > 10 ) {
		return number + 1;
	}

	const foo = doSomeCostlyOperation();
	return number + foo;
}
```

## Options

This rule accepts a single options argument:

- Set the `excludePattern` option to a regular expression string to exempt specific function calls by name.

// see https://eslint.org/docs/rules/#ecmascript-6
//
module.exports = {
	// require braces around arrow function bodies
	'arrow-body-style': 'off',
	// require parentheses around arrow function arguments
	'arrow-parens': 'off',
	// enforce consistent spacing before and after the arrow in arrow functions
	'arrow-spacing': 'off',
	// require super() calls in constructors
	'constructor-super': 'error',
	// enforce consistent spacing around * operators in generator functions
	'generator-star-spacing': 'off',
	// disallow reassigning class members
	'no-class-assign': 'off',
	// disallow arrow functions where they could be confused with comparisons
	'no-confusing-arrow': 'off',
	// disallow reassigning `const` variables
	'no-const-assign': 'error',
	// disallow duplicate class members
	'no-dupe-class-members': 'error',
	// disallow duplicate module imports
	'no-duplicate-imports': 'error',
	// disallow `new` operators with the `Symbol` object
	'no-new-symbol': 'off',
	// disallow specified modules when loaded by `import`
	'no-restricted-imports': 'off',
	// disallow `this`/`super` before calling `super()` in constructors
	'no-this-before-super': 'off',
	// disallow unnecessary computed property keys in object literals
	'no-useless-computed-key': 'error',
	// disallow unnecessary constructors
	'no-useless-constructor': 'error',
	// disallow renaming import, export, and destructured assignments to the same name
	'no-useless-rename': 'off',
	// require `let` or `const` instead of `var`
	'no-var': 'error',
	// require or disallow method and property shorthand syntax for object literals
	'object-shorthand': 'off',
	// require arrow functions as callbacks
	'prefer-arrow-callback': 'off',
	// require `const` declarations for variables that are never reassigned after declared
	'prefer-const': 'error',
	// require destructuring from arrays and/or objects
	'prefer-destructuring': 'off',
	// disallow `parseInt()` and `Number.parseInt()` in favor of binary, octal, and hexadecimal literals
	'prefer-numeric-literals': 'off',
	// require rest parameters instead of `arguments`
	'prefer-rest-params': 'off',
	// require spread operators instead of `.apply()`
	'prefer-spread': 'off',
	// require template literals instead of string concatenation
	'prefer-template': 'off',
	// require generator functions to contain `yield`
	'require-yield': 'off',
	// enforce spacing between rest and spread operators and their expressions
	'rest-spread-spacing': 'off',
	// enforce sorted import declarations within modules
	'sort-imports': 'off',
	// require symbol descriptions
	'symbol-description': 'off',
	// require or disallow spacing around embedded expressions of template strings
	'template-curly-spacing': [ 'error', 'always' ],
	// require or disallow spacing around the `*` in `yield*` expressions
	'yield-star-spacing': 'off',
};

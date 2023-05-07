# jsx-a11y-anchor-has-content

This rule wraps around [eslint-plugin-jsx-a11y/anchor-has-content](https://github.com/jsx-eslint/eslint-plugin-jsx-a11y/blob/main/docs/rules/anchor-has-content.md), continuing to enforce the original rule unless createInterpolateElement is being used to render an anchor element
In scenarios where an anchor is used through createInterpolateElement, this wrap-around rule identifies missing content in anchors for simple scenarios.

## Rule details

To use the optional object argument of type object (as in [eslint-plugin-jsx-a11y/anchor-has-content](https://github.com/jsx-eslint/eslint-plugin-jsx-a11y/blob/main/docs/rules/anchor-has-content.md)), configure it under the rule wrapper's name. See the [original documentation](https://github.com/jsx-eslint/eslint-plugin-jsx-a11y/blob/main/docs/rules/anchor-has-content.md) for other details.

```json
{
    "rules": {
        "@wordpress/jsx-a11y-anchor-has-content": [
					"error", { "components": ["MyAnchor"] }
				],
    }
}
```

## Examples of correct usage

With createInterpolateElement and a translate `__` function call:

```jsx
( ) => {
				( <div>
					   { createInterpolateElement( __( 'This is an <a> anchor with content </a>.' ), {
							   a: <a href="https://wordpress.org" />,
					   } ) }
				   </div>
			   )
		   };
```

With createInterpolateElement, without `__`:

```jsx
( ) => {
				( <div>
					   { createInterpolateElement( 'This is an <a> anchor with content </a>.', {
							   a: <a href="https://wordpress.org" />,
					   } ) }
				   </div>
			   )
		   };
```

Without createInterpolateElement:

```jsx
( ) => {
				( <div>
					   This is an <a href="https://wordpress.org"> anchor with content </a>
				   </div>
			   )
		   };
```

With custom components configured (works with and without createInterpolateElement)

```jsx
// MyAnchor.js
const MyAnchor = props => {
  return (
    <a {...props}>{ props.children }</a>
  );
}

...

// Something.js
...
return (
  <MyAnchor>This is valid content</Anchor>
);
```

## Examples of incorrect usage

With createInterpolateElement and a translate `__` function call:

```jsx
( ) => {
				( <div>
					   { createInterpolateElement( __( 'This is an <a></a>.' ), {
							   a: <a href="https://wordpress.org" />,
					   } ) }
				   </div>
			   )
		   };
```

With createInterpolateElement, without `__`:

```jsx
( ) => {
				( <div>
					   { createInterpolateElement( 'This is an <a></a>.', {
							   a: <a href="https://wordpress.org" />,
					   } ) }
				   </div>
			   )
		   };
```

Without createInterpolateElement:

```jsx
( ) => {
				( <div>
					   This is an <a href="https://wordpress.org"></a>
				   </div>
			   )
		   };
```

With custom components configured (works with and without createInterpolateElement)

```jsx
// MyAnchor.js
const MyAnchor = props => {
  return (
    <a {...props}>{ props.children }</a>
  );
}

...

// Something.js - empty content
...
return (
  <MyAnchor></Anchor>
);
```

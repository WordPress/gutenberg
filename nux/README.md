NUX (New User eXperience)
=========================

The NUX module exposes components, and `wp.data` methods useful for onboarding a new user to the WordPress admin interface. Specifically, it exposes _tips_ and _guides_.

A _tip_ is a component that points to an element in the UI and contains text that explains the element's functionality. The user can dismiss a tip, in which case it never shows again. The user can also disable tips entirely. Information about tips is persisted between sessions using `localStorage`.

A _guide_ allows a series of of tips to be presented to the user one by one. When a user dismisses a tip that is in a guide, the next tip in the guide is shown.

## DotTip

`DotTip` is a React component that renders a single _tip_ on the screen. The tip will point to the React element that `DotTip` is nested within. Each tip is uniquely identified by a string passed to `id`.

See [the component's README][dot-tip-readme] for more information.

[dot-tip-readme]: https://github.com/WordPress/gutenberg/tree/master/nux/components/dot-tip/README.md

```jsx
<button onClick={ ... }>
	Add to Cart
	<DotTip id="acme/add-to-cart">
		Click here to add the product to your shopping cart.
	</DotTip>
</button>
}
```

## Determining if a tip is visible

You can programmatically determine if a tip is visible using the `isTipVisible` select method.

```jsx
const isVisible = select( 'core/nux' ).isTipVisible( 'acme/add-to-cart' );
console.log( isVisible ); // true or false
```

## Manually dismissing a tip

`dismissTip` is a dispatch method that allows you to programmatically dismiss a tip.

```jsx
<button
	onClick={ () => {
		dispatch( 'core/nux' ).dismissTip( 'acme/add-to-cart' );
	}
>
	Dismiss tip
</button>
```

## Manually disabling tips

`disableTips` is a dispatch method that allows you to programmatically disable all tips.

```jsx
<button
	onClick={ () => {
		dispatch( 'core/nux' ).disableTips();
	}
>
	Disable tips
</button>
```

## Triggering a guide

You can group a series of tips into a guide by calling the `triggerGuide` dispatch method. The given tips will then appear one by one.

A tip cannot be added to more than one guide.

```jsx
dispatch( 'core/nux' ).triggerGuide( [ 'acme/product-info', 'acme/add-to-cart', 'acme/checkout' ] );
```

## Getting information about a guide

`getAssociatedGuide` is a select method that returns useful information about the state of the guide that a tip is associated with.

```jsx
const guide = select( 'core/nux' ).getAssociatedGuide( 'acme/add-to-cart' );
console.log( 'Tips in this guide:', guide.tipIDs );
console.log( 'Currently showing:', guide.currentTipID );
console.log( 'Next to show:', guide.nextTipID );
```

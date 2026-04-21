# Warning

Displays a warning message, typically in the context of a particular block. It may present given _actions_ to the user.

_As seen in [BlockInvalidWarning](https://github.com/WordPress/gutenberg/blob/e92672936a3c8c3e20cf7b98a442f311af7b45fe/packages/block-editor/src/components/block-list/block-invalid-warning.js#L53-L66):_

<img width="614" alt="warning-block-invalid" src="https://user-images.githubusercontent.com/150562/94034403-e6223500-fdb9-11ea-8166-c73629f42e38.png">

_As seen in [withMultipleValidation](https://github.com/WordPress/gutenberg/blob/e92672936a3c8c3e20cf7b98a442f311af7b45fe/packages/edit-post/src/hooks/validate-multiple-use/index.js#L78-L115):_

<img width="625" alt="warning-block-use-once" src="https://user-images.githubusercontent.com/150562/94034410-e7ebf880-fdb9-11ea-8873-9df9ef194825.png">

## Usage

### Props

All of the following are optional.

-   `children`: Intended to represent the block to which the warning pertains. See screenshots above.

-   `className`: Classes to pass to element.

-   `actions`: An array of elements to be rendered as action buttons in the warning element.

-   `secondaryActions`: An array of { title, onClick } to be rendered as options in a dropdown of secondary actions.

### Example

```js
<Warning
	actions={ [ <Button onClick={ fixIssue }>{ __( 'Fix issue' ) }</Button> ] }
	secondaryActions={ [
		{
			title: __( 'Get help' ),
			onClick: getHelp,
		},
		{
			title: __( 'Remove block' ),
			onClick: removeBlock,
		},
	] }
>
	{ __( 'This block ran into an issue.' ) }
</Warning>
```

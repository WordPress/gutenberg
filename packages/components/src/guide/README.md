Guide
========

`Guide` is a React component that renders a _user guide_ in a modal. The guide consists of several `GuidePage` components which the user can step through one by one. The guide is finished when the modal is closed or when the user clicks _Finish_ on the last page of the guide.

## Usage

```jsx
function MyTutorial() {
	const [ isOpen, setIsOpen ] = useState( true );

	if ( ! isOpen ) {
		return null;
	}

	<Guide onFinish={ () => setIsOpen( false ) }>
		<GuidePage>
			<p>Welcome to the ACME Store! Select a category to begin browsing our wares.</p>
		</GuidePage>
		<GuidePage>
			<p>When you find something you love, click <i>Add to Cart</i> to add the product to your shopping cart.</p>
		</GuidePage>
	</Guide>
}
```

## Props

The component accepts the following props:

### onFinish

A function which is called when the guide is finished. The guide is finished when the modal is closed or when the user clicks _Finish_ on the last page of the guide.

- Type: `function`
- Required: Yes

### children

A list of `GuidePage` components. One page is shown at a time.

- Required: Yes

### className

A custom class to add to the modal.

- Type: `string`
- Required: No

### contentLabel

This property is used as the modal's accessibility label. It is required for accessibility reasons.

- Type: `String`
- Required: Yes

### finishButtonText

Use this to customize the label of the _Finish_ button shown at the end of the guide.

- Type: `string`
- Required: No

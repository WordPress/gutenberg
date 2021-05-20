# Guide

`Guide` is a React component that renders a _user guide_ in a modal. The guide consists of several pages which the user can step through one by one. The guide is finished when the modal is closed or when the user clicks _Finish_ on the last page of the guide.

## Usage

```jsx
function MyTutorial() {
	const [ isOpen, setIsOpen ] = useState( true );

	if ( ! isOpen ) {
		return null;
	}

	return (
		<Guide
			onFinish={ () => setIsOpen( false ) }
			pages={ [
				{
					content: <p>Welcome to the ACME Store!</p>,
				},
				{
					image: <img src="https://acmestore.com/add-to-cart.png" />,
					content: (
						<p>
							Click <i>Add to Cart</i> to buy a product.
						</p>
					),
				},
			] }
		/>
	);
}
```

## Props

The component accepts the following props:

### onFinish

A function which is called when the guide is finished. The guide is finished when the modal is closed or when the user clicks _Finish_ on the last page of the guide.

-   Type: `function`
-   Required: Yes

### pages

A list of objects describing each page in the guide. Each object **must** contain a `'content'` property and may optionally contain a `'image'` property.

-   Type: `array`
-   Required: Yes

### className

A custom class to add to the modal.

-   Type: `string`
-   Required: No

### contentLabel

This property is used as the modal's accessibility label. It is required for accessibility reasons.

-   Type: `String`
-   Required: Yes

### finishButtonText

Use this to customize the label of the _Finish_ button shown at the end of the guide.

-   Type: `string`
-   Required: No

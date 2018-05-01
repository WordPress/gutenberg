Modal
=======

The modal is used to create an accessible modal over an application.

**Note:** The API for this modal has been mimicked to resemble `react-modal`.

## Usage

Render a screen overlay with a modal on top.
```jsx
	<ModalContextProvider value={ { elementId: 'wpwrap' } }>
		<Modal
			aria={ {
				labelledby: 'modal-title',
				describedby: 'modal-description',
			} }
			parentSelector={ () => {
				return document.getElementById( 'wpwrap' );
			} )
			>
			<ModalContent>
				<h2 id="modal-title">My awesome modal!</h2>
				<p id="modal-description">This modal is meant to be awesome!</p>
			</ModalConent>
		</Modal>
    </ModalContextProvider>
```

## Props

The set of props accepted by the component will be specified below.
Props not included in this set will be applied to the input elements.

### onRequestClose

This function is called to indicate that the modal should be closed.

- Type: `function`
- Required: Yes

### contentLabel

If this property is added, it will be added to the modal content `div` as `aria-label`.
You are encouraged to use this if `aria.labelledby` is not provided.

- Type: `String`
- Required: No

### aria.labelledby

If this property is added, it will be added to the modal content `div` as `aria-labelledby`.
You are encouraged to use this when the modal is visually labelled.

- Type: `String`
- Required: No

### aria.describedby

If this property is added, it will be added to the modal content `div` as `aria-describedby`.

- Type: `String`
- Required: No

### focusOnMount

If this property is true, it will focus the first tabbable element rendered in the modal.

- Type: `bool`
- Required: No
- Default: true

### shouldCloseOnEsc

If this property is added, it will determine whether the modal requests to close when the escape key is pressed. 

- Type: `bool`
- Required: No
- Default: true

### shouldCloseOnClickOutside

If this property is added, it will determine whether the modal requests to close when a mouse click occurs outside of the modal content.

- Type: `bool`
- Required: No
- Default: true

### style.content

If this property is added, it will add inline styles to the modal content `div`.

- Type: `Object`
- Required: No

### style.overlay

If this property is added, it will add inline styles to the modal overlay `div`.

- Type: `Object`
- Required: No

### className

If this property is added, it will an additional class name to the modal content `div`.

- Type: `String`
- Required: No

### overlayClassName

If this property is added, it will an additional class name to the modal overlay `div`.

- Type: `String`
- Required: No

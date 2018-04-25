RangeControl
=======

The modal uses `react-modal` to create an accessible modal over an application.

## Usage

Render a screen overlay with a modal on top.
```js
// When the app element is set it puts an aria-hidden="true" to the provided node.
Modal.setAppElement( document.getElementById( 'wpwrap' ).parentNode )
```
```jsx
import { Modal } from '@wordpress/components';
import { Component } from '@wordpress/element';

class ModalWrapper extends Component {
	constructor( props ) {
		super( props );

		this.state = {
			isOpen: true,
		};

		this.onClose = this.onClose.bind( this );
	}
	onClose() {
		this.setState( {
			isOpen: false,
		} );
	}
	render() {
		const { children } = this.props;
		return <Modal { ...this.props } isOpen={ this.state.isOpen } onRequestClose={ this.onClose } >
			{ children }
		</Modal>;
	}
}

export default ModalWrapper;

```

## Props

The set of props accepted by the component will be specified below.
Props not included in this set will be applied to the input elements.

Many props supported by react-modal have been included here. 

### isOpen

Determines whether the modal should be open when started. 

- Type: `bool`
- Required: No
- Default: false

### render

Determines whether the modal should be rendered or not.

- Type: `bool`
- Required: No
- Default: true

### style.content

If this property is added, it will add inline styles to the modal content `div`.

- Type: `Object`
- Required: No

### className

If this property is added, it will an additional class name to the modal content `div`.

- Type: `String`
- Required: No

### overlayClassName

Sets the class of the overlay around the modal.

- Type: `String`
- Required: No
- Default: 'components-modal__frame'

### ContentClassName

Sets the class of the content block in the modal.

- Type: `String`
- Required: No
- Default: 'components-modal__content'

### aria.labelledby

If this property is added, it will be added to the modal content `div` as `aria-labelledby`.
You are encouraged to use this when the modal is visually labelled.

- Type: `String`
- Required: No
- Default: 'modalID'

### icon

This property sets the icon in the header of the modal

- Type: `Element`
- Required: No
- Default: null
 
### title

This property sets the title in the header of the modal.

- Type: `String`
- Required: No
- Default: 'Plugin screen'

### bodyOpenClassName

Sets the classname of the open body

- Type: `String`
- Required: No
- Default: 'modal-body--open'

### portalClassName

Sets the classname of the open body

- Type: `String`
- Required: No
- Default: 'WordPress-modal'

### onRequestClose

This function is called to indicate that the modal should be closed.

- Type: `function`
- Required: Yes
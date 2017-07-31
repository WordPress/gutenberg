Keyboard Shortcuts
==================

`<KeyboardShortcuts />` is a component which renders no children of its own, but instead handles keyboard sequences during the lifetime of the rendering element.

It uses the [Mousetrap](https://craig.is/killing/mice) library to implement keyboard sequence bindings.

## Example

Render `<KeyboardShortcuts />` with a `shortcuts` prop object:

```jsx
class SelectAllDetection extends Component {
	constructor() {
		super( ...arguments );

		this.setAllSelected = this.setAllSelected.bind( this );

		this.state = { isAllSelected: false };
	}

	setAllSelected() {
		this.setState( { isAllSelected: true } );
	}

	render() {
		return (
			<div>
				<KeyboardShorcuts shortcuts={ {
					'mod+a': this.setAllSelected,
				} } />
				Combination pressed? { isAllSelected ? 'Yes' : 'No' }
			</div>
		);
	}
}
```

__Note:__ The value of each shortcut should be a consistent function reference, not an anonymous function. Otherwise, the callback will not be correctly unbound when the component unmounts.

__Note:__ The callback will not be invoked if the key combination occurs in an editable field.

## Props

The component accepts the following props:

### shortcuts

An object of shortcut bindings, where each key is a keyboard combination, the value of which is the callback to be invoked when the key combination is pressed.

- Type: `Object`
- Required: No

## References

- [Mousetrap documentation](https://craig.is/killing/mice)

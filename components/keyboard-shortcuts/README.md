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
		this.save = this.save.bind( this );

		this.state = { isAllSelected: false };
	}

	setAllSelected() {
		this.setState( { isAllSelected: true } );
	}

	save() {
		this.props.onSave();
	}

	render() {
		return (
			<div>
				<KeyboardShorcuts shortcuts={ {
					'mod+a': this.setAllSelected,
					'mod+s': [ this.save, true ],
				} } />
				Combination pressed? { isAllSelected ? 'Yes' : 'No' }
			</div>
		);
	}
}
```

__Note:__ The value of each shortcut should be a consistent function reference, not an anonymous function. Otherwise, the callback will not be correctly unbound when the component unmounts.

__Note:__ The callback will not be invoked if the key combination occurs in an editable field, unless you pass the callback as an array with the callback and `true` as entries of the array respectively. Refer to the example above, and see the `shortcuts` prop documentation for more information.

## Props

The component accepts the following props:

### shortcuts

An object of shortcut bindings, where each key is a keyboard combination, the value of which is the callback to be invoked when the key combination is pressed. To capture a key event globally (including within input fields), assign as the value an array with the function callback as the first argument and `true` as the second argument.

- Type: `Object`
- Required: No

## References

- [Mousetrap documentation](https://craig.is/killing/mice)

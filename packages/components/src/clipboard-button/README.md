ClipboardButton
===============

## Usage

```jsx
class MyClipboardButton extends React.Component {
	constructor() {
		super( ...arguments );
		this.state = {
			hasCopied: false,
		};
	}

	render() {		
		return (
			<ClipboardButton
				isPrimary
				text="WordPress"
				onCopy={ () => this.setState( { hasCopied: true } ) }
				onFinishCopy={ () => this.setState( { hasCopied: false } ) }
			>
				{ this.state.hasCopied ? 'Copied!' : 'Copy Text' }
			</ClipboardButton>
		);
	}
}
```

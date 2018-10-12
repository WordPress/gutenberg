URLPopover
===========

URLPopover is a presentational React component used to render a popover used for editing and viewing a url.

## Setup

The component will be rendered adjacent to its parent.

```jsx
import { ToggleControl, IconButton } from '@wordpress/components';
import { URLPopover } from '@wordpress/editor';

class MyURLPopover extends Component {
	constructor() {
		super( ...arguments );

		this.onChangeURL = this.onChangeURL.bind( this );
		this.openURLPopover = this.closeURLPopover.bind( this );
		this.closeURLPopover = this.closeURLPopover.bind( this );
		this.submitURL = this.submitURL.bind( this );
		this.setTarget = this.setTarget.bind( this );

		this.state = {
			isVisible: false,
		};
	}

	onChangeURL( url ) {
		this.setState( { url } );
	}

	openURLPopover() {
		this.setState( {
			isVisible: true,
		} );
	}

	closeURLPopover() {
		this.setState( {
			isVisible: false,
		} );
	}

	submitURL() {
		// Store the url.
	}

	setTarget() {
		// Store the updated target setting.
	}

	render() {
		const { url, isVisible, isEditing } = this.state;

		if ( ! isVisible ) {
			return;
		}

		return (
			<URLPopover
				onClickOutside={ this.closeURLPopover }
				renderURLEditor={ () => (
					<form onSubmit={ this.submitURL }>
						<input type="url" value={ url } onChange={ this.onChangeURL } />
						<IconButton icon="editor-break" label={ __( 'Apply' ) } type="submit" />
					</form>
				) }
				renderSettings={ () => (
					<ToggleControl
						label={ __( 'Open in New Window' ) }
						checked={ opensInNewWindow }
						onChange={ this.setTarget }
					/>
				) }
			/>
		);
	}
}
```

## Props

The component accepts the following props.

### position

Where the Popover should be positioned relative to its parent. Defaults to "bottom center".

- Type: `String`
- Required: No
- Default: "bottom center"

### onClickOutside

Handles an event triggered when the user clicks outside of the URLPopover.

- Type: `Function`
- Required: No

### renderURLEditor

Callback used to return the rendered elements for editing the URL—usually a form with an input field that allows
the user to type in a URL and a submit button.

- Type: `Function`
- Required: Yes

### renderSettings

Callback used to return the React Elements that will be rendered inside the settings drawer. When this function
is provided, a toggle button will be rendered in the popover that allows the user to open and close the settings
drawer.

- Type: `Function`
- Required: No

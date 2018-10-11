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
		this.editURL = this.editURL.bind( this );
		this.setTarget = this.setTarget.bind( this );

		this.state = {
			isEditing: true,
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
		

		// Switch from 'editing' to 'viewing' mode.
		this.setState( {
			isEditing: false,
		} );
	}

	editURL() {
		// Switch from 'viewing' to 'editing' mode.
		this.setState( {
			isEditing: true,
		} );
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
				isEditing={ isEditing }
				renderEditingState={ () => (
					<form onSubmit={ this.submitURL }>
						<input type="url" value={ url } onChange={ this.onChangeURL } />
						<IconButton icon="editor-break" label={ __( 'Apply' ) } type="submit" />
					</form>
				) }
				renderViewingState={ () => (
					<div>
						{ url }
						<IconButton icon="edit" label={ __( 'Edit' ) } onClick={ this.editURL } />
					</div>
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

Handles an event triggered when the user clicks outside of the Popover.

- Type: `Function`
- Required: No

### renderEditingState

Callback used to return the React Elements that will be rendered when the user is editing the url.

- Type: `Function`
- Required: Yes

### renderViewingState

Callback used to return the React Elements that will be rendered when the user is viewing the url.

- Type: `Function`
- Required: Yes

### renderSettings

Callback used to return the React Elements that will be rendered when the user is viewing the settings.

- Type: `Function`
- Required: No

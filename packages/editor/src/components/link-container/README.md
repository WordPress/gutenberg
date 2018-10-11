LinkContainer
===========

LinkContainer is a presentational React component used to render a popover used for editing a link

## Setup

This component is a presentational component that can be used for implementing link editing functionality.

```jsx
import { ToggleControl, IconButton } from '@wordpress/components';
import { LinkContainer } from '@wordpress/editor';

class MyLinkContainer extends Component {
	constructor() {
		super( ...arguments );

		this.onChangeURL = this.onChangeURL.bind( this );
		this.closeLinkContainer = this.closeLinkContainer.bind( this );
		this.submitLink = this.submitLink.bind( this );
		this.editLink = this.editLink.bind( this );

		this.state = {
			isEditing: true,
			isVisible: false,
		};
	}

	onChangeURL( url ) {
		this.setState( { url } );
	}

	closeLinkContainer() {
		this.setState( {
			isVisible: true,
		} );
	}

	submitLink() {
		// Store the url.
		
		this.setState( {
			isEditing: false,
		} );
	}

	setLinkTarget() {
		// Change the target setting.
	}

	render() {
		const { url, isEditing } = this.state;
		return (
			<LinkContainer
				onClickOutside={ this.closeLinkContainer }
				isEditing={ isEditing }
				renderEditingState={ () => (
					<form onSubmit={ this.submitLink }>
						<input type="url" value={ url } onChange={ this.onChangeURL } />
						<IconButton icon="editor-break" label={ __( 'Apply' ) } type="submit" />
					</form>
				) }
				renderPreviewState={ () => (
					<div>
						{ url }
						<IconButton icon="edit" label={ __( 'Edit' ) } onClick={ this.editLink } />
					</div>
				) }
				renderSettings={ () => (
					<ToggleControl
						label={ __( 'Open in New Window' ) }
						checked={ opensInNewWindow }
						onChange={ this.setLinkTarget }
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

### renderPreviewState

Callback used to return the React Elements that will be rendered when the user is viewing the url.

- Type: `Function`
- Required: Yes

### renderSettings

Callback used to return the React Elements that will be rendered when the user is viewing the settings.

- Type: `Function`
- Required: No

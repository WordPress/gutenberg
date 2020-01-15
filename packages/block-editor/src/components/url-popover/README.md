URLPopover
===========

URLPopover is a presentational React component used to render a popover used for editing and viewing a url.

## Setup

The component will be rendered adjacent to its parent.

```jsx
import { ToggleControl, Button } from '@wordpress/components';
import { URLPopover } from '@wordpress/block-editor';

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
		// Not shown: Store the updated url.

		this.closeURLPopover();
	}

	setTarget() {
		// Not shown: Store the updated 'opensInNewWindow' setting.
	}

	render() {
		const { opensInNewWindow } = this.props;
		const { url, isVisible, isEditing } = this.state;

		return (
			<>
				<Button onClick={ this.openURLPopover }>Edit URL</Button>
				{ isVisible && (
					<URLPopover
						onClose={ this.closeURLPopover }
						renderSettings={ () => (
							<ToggleControl
								label={ __( 'Open in New Tab' ) }
								checked={ opensInNewWindow }
								onChange={ this.setTarget }
							/>
						) }
					>
						<form onSubmit={ this.submitURL }>
							<input type="url" value={ url } onChange={ this.onChangeURL } />
							<Button icon="editor-break" label={ __( 'Apply' ) } type="submit" />
						</form>
					</URLPopover>
				) }
			</>
		);
	}
}
```

## Props

The component accepts the following props. Any other props are passed through to the underlying `Popover` component ([refer to props documentation](/packages/components/src/popover/README.md)).

### position

Where the Popover should be positioned relative to its parent. Defaults to "bottom center".

- Type: `String`
- Required: No
- Default: "bottom center"

### focusOnMount

Provides control over which element is focused when the URLPopover mounts. Pass `false` to avoid focusing
an element.

- Type: `String`
- Required: No
- Default: "firstElement"

### renderSettings

Callback used to return the React Elements that will be rendered inside the settings drawer. When this function
is provided, a toggle button will be rendered in the popover that allows the user to open and close the settings
drawer.

- Type: `Function`
- Required: No


## Useful UI pieces

The URLPopover exposes two components that may be used as child components to make the UI creation process easier.
Although in the editor these components are used inside URLPopover and they were built with URLPopover use cases in mind, it maybe is possible and perfectly fine to use them standalone if they fit a use-case.

### LinkViewer

LinkViewer provides a simple UI that allows users to see a link and may also offer a button to switch to a mode that will enable editing that link.
The component accepts the following props. Any other props are passed through to the underlying `div` container.

### className

A class that together with "block-editor-url-popover__link-viewer" is used as a class of the wrapper div.
If no className is passed only "block-editor-url-popover__link-viewer" is used.

- Type: `String`
- Required: No

### linkClassName

A class that will be used in the component that renders the link. 

- Type: `String`
- Required: No

### url

The current URL to view.

- Type: `String`
- Required: Yes

### urlLabel

The URL label, if not passed a label is automatically generated from the `url`.

- Type: `String`
- Required: No

### onEditLinkClick

A function called when the user presses the button that allows editing a link. If not passed the link-edit button is not rendered.

- Type: `function`
- Required: No


### LinkEditor

LinkEditor provides a simple UI that allows users to edit link.
The component accepts the following props. Any other props are passed through to the underlying `form` container.

### value

This property should be set to the attribute (or component state) property used to store the URL.
This property is directly passed to  `URLInput` component ([refer to its documentation](/packages/components/src/url-input/README.md)) to read additional details.

- Type: `String`
- Required: Yes

### onChange

Called when the value changes. The second parameter is `null` unless the user selects a post from the suggestions dropdown.
More
This property is directly passed to component `URLInput` ([refer to its documentation](/packages/components/src/url-input/README.md)) to read additional details.

- Type: `function`
- Required: Yes

### autocompleteRef

Reference passed to the auto complete element of the ([URLInput component](/packages/components/src/url-input/README.md)).

- Type: `Object`
- Required: no

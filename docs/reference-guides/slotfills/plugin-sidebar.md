# PluginSidebar

This slot allows adding items to the tool bar of either the Post or Site editor screens.
Using this slot will add an icon to the toolbar that, when clicked, opens a panel with containing the items wrapped in the `<PluginSidebar />` component.
Additionally, it will also create a `<PluginSidebarMoreMenuItem />` that will allow opening the panel from Options panel when clicked.

## Example

```jsx
import { __ } from '@wordpress/i18n';
import { PluginSidebar } from '@wordpress/editor';
import {
	PanelBody,
	Button,
	TextControl,
	SelectControl,
} from '@wordpress/components';
import { registerPlugin } from '@wordpress/plugins';
import { useState } from '@wordpress/element';

const PluginSidebarExample = () => {
	const [ text, setText ] = useState( '' );
	const [ select, setSelect ] = useState( 'a' );

	return (
		<PluginSidebar
			name="plugin-sidebar-example"
			title={ __( 'My PluginSidebar' ) }
			icon={ 'smiley' }
		>
			<PanelBody>
				<h2>
					{ __( 'This is a heading for the PluginSidebar example.' ) }
				</h2>
				<p>
					{ __(
						'This is some example text for the PluginSidebar example.'
					) }
				</p>
				<TextControl
					__nextHasNoMarginBottom
					__next40pxDefaultSize
					label={ __( 'Text Control' ) }
					value={ text }
					onChange={ ( newText ) => setText( newText ) }
				/>
				<SelectControl
					label={ __( 'Select Control' ) }
					value={ select }
					options={ [
						{ value: 'a', label: 'Option A' },
						{ value: 'b', label: 'Option B' },
						{ value: 'c', label: 'Option C' },
					] }
					onChange={ ( newSelect ) => setSelect( newSelect ) }
				/>
				<Button variant="primary">{ __( 'Primary Button' ) } </Button>
			</PanelBody>
		</PluginSidebar>
	);
};

// Register the plugin.
registerPlugin( 'plugin-sidebar-example', { render: PluginSidebarExample } );
```

## Location

![PluginSidebar example expanded](https://developer.wordpress.org/files/2024/08/plugin-sidebar-example.png)

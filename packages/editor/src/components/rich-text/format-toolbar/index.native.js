/**
 * WordPress dependencies
 */

import { Toolbar, Slot } from '@wordpress/components';

const FormatToolbar = ( { controls } ) => {
	return (
		<Toolbar>
			{ controls.map( ( format ) =>
				<Slot name={ `RichText.ToolbarControls.${ format }` } key={ format } />
			) }
			<Slot name="RichText.ToolbarControls" />
		</Toolbar>
	);
};

export default FormatToolbar;

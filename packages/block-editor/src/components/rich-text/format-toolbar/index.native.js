/**
 * WordPress dependencies
 */

import { Toolbar, Slot } from '@wordpress/components';

const FormatToolbar = () => {
	return (
		<Toolbar>
			{ [ 'bold', 'italic', 'link' ].map( ( format ) =>
				<Slot name={ `RichText.ToolbarControls.${ format }` } key={ format } />
			) }
			<Slot name="RichText.ToolbarControls" />
		</Toolbar>
	);
};

export default FormatToolbar;

/**
 * WordPress dependencies
 */

import { Toolbar, Slot } from '@wordpress/components';

const FormatToolbar = ( { controls } ) => {
	return (
		<div className="editor-format-toolbar">
			<Toolbar>
				{ controls.map( ( format ) =>
					<Slot name={ `RichText.ToolbarControls.${ format }` } key={ format } />
				) }
			</Toolbar>
		</div>
	);
};

export default FormatToolbar;

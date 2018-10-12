/**
 * WordPress dependencies
 */

import { Toolbar, Slot } from '@wordpress/components';

const FormatToolbar = ( { controls } ) => {
	return (
		<div className="editor-format-toolbar">
			<Toolbar>
				{ controls.map( ( format, index ) =>
					<Slot name={ `RichText.ToolbarControls.${ format }` } key={ index } />
				) }
			</Toolbar>
		</div>
	);
};

export default FormatToolbar;

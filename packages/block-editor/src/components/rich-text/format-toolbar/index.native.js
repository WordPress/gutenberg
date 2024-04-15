/**
 * WordPress dependencies
 */

import { Slot } from '@wordpress/components';

const FormatToolbar = ( { isCompactMode } ) => {
	return (
		<>
			{ [ 'bold', 'italic', 'link' ].map( ( format ) => (
				<Slot
					name={ `RichText.ToolbarControls.${ format }` }
					key={ format }
				/>
			) ) }
			{ ! isCompactMode && <Slot name="RichText.ToolbarControls" /> }
		</>
	);
};

export default FormatToolbar;

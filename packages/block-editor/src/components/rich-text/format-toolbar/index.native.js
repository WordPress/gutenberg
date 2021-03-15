/**
 * WordPress dependencies
 */

import { Slot } from '@wordpress/components';

const FormatToolbar = () => {
	return (
		<>
			{ [ 'bold', 'italic', 'link' ].map( ( format ) => (
				<Slot
					name={ `RichText.ToolbarControls.${ format }` }
					key={ format }
				/>
			) ) }
			<Slot name="RichText.ToolbarControls" />
		</>
	);
};

export default FormatToolbar;

/**
 * WordPress dependencies
 */
import { Toolbar } from '@wordpress/components';
import { Slot } from '@wordpress/slot-fill';

const FormatToolbar = () => {
	return (
		<Toolbar>
			{ [ 'bold', 'italic', 'link' ].map( ( format ) => (
				<Slot
					name={ `RichText.ToolbarControls.${ format }` }
					key={ format }
				/>
			) ) }
			<Slot name="RichText.ToolbarControls" />
		</Toolbar>
	);
};

export default FormatToolbar;

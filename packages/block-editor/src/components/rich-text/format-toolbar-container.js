/**
 * WordPress dependencies
 */
import { Popover } from '@wordpress/components';

/**
 * Internal dependencies
 */
import BlockControls from '../block-controls';
import FormatToolbar from './format-toolbar';

const FormatToolbarContainer = ( { inline, anchorRef } ) => {
	if ( inline ) {
		// Render in popover
		return (
			<Popover
				noArrow
				position="top center"
				focusOnMount={ false }
				anchorRef={ anchorRef }
				className="block-editor-rich-text__inline-format-toolbar"
				__unstableSlotName="block-toolbar"
			>
				<FormatToolbar />
			</Popover>
		);
	}
	// Render regular toolbar
	return (
		<BlockControls group="inline">
			<FormatToolbar />
		</BlockControls>
	);
};

export default FormatToolbarContainer;

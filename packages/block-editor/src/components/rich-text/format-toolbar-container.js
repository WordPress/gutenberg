/**
 * WordPress dependencies
 */
import { Popover } from '@wordpress/components';

/**
 * Internal dependencies
 */
import BlockFormatControls from '../block-format-controls';
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
			>
				<FormatToolbar />
			</Popover>
		);
	}
	// Render regular toolbar
	return (
		<BlockFormatControls>
			<FormatToolbar />
		</BlockFormatControls>
	);
};

export default FormatToolbarContainer;

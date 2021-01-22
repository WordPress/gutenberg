/**
 * WordPress dependencies
 */
import { Popover, Toolbar } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import BlockFormatControls from '../block-format-controls';
import FormatToolbar from './format-toolbar';

const FormatToolbarContainer = ( {
	inline,
	anchorRef,
	label = __( 'Format' ),
} ) => {
	if ( inline ) {
		// Render in popover
		return (
			<Popover
				noArrow
				position="top center"
				focusOnMount={ false }
				anchorRef={ anchorRef }
				className="block-editor-rich-text__inline-format-toolbar"
				// Render inline
				__unstableSlotName={ null }
			>
				<Toolbar label={ label }>
					<FormatToolbar />
				</Toolbar>
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

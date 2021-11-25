/**
 * WordPress dependencies
 */
import { Popover, ToolbarGroup } from '@wordpress/components';

/**
 * Internal dependencies
 */
import BlockControls from '../block-controls';
import FormatToolbar from './format-toolbar';

const FormatToolbarContainer = ( { inline, anchorRef } ) => {
	if ( inline ) {
		// Render in popover.
		return (
			<Popover
				noArrow
				position="top center"
				focusOnMount={ false }
				anchorRef={ anchorRef }
				className="block-editor-rich-text__inline-format-toolbar"
				__unstableSlotName="block-toolbar"
			>
				<div className="block-editor-rich-text__inline-format-toolbar-group">
					<ToolbarGroup>
						<FormatToolbar />
					</ToolbarGroup>
				</div>
			</Popover>
		);
	}
	// Render regular toolbar.
	return (
		<BlockControls group="inline">
			<FormatToolbar />
		</BlockControls>
	);
};

export default FormatToolbarContainer;

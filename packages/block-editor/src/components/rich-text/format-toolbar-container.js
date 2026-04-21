/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Popover, ToolbarGroup } from '@wordpress/components';

/**
 * Internal dependencies
 */
import BlockControls from '../block-controls';
import FormatToolbar from './format-toolbar';
import NavigableToolbar from '../navigable-toolbar';

function InlineToolbar( { popoverAnchor } ) {
	return (
		<Popover
			placement="top"
			focusOnMount={ false }
			anchor={ popoverAnchor }
			className="block-editor-rich-text__inline-format-toolbar"
			__unstableSlotName="block-toolbar"
		>
			<NavigableToolbar
				className="block-editor-rich-text__inline-format-toolbar-group"
				/* translators: accessibility text for the inline format toolbar */
				aria-label={ __( 'Format tools' ) }
			>
				<ToolbarGroup>
					<FormatToolbar />
				</ToolbarGroup>
			</NavigableToolbar>
		</Popover>
	);
}

const FormatToolbarContainer = ( { inline, editableContentElement } ) => {
	if ( inline ) {
		return <InlineToolbar popoverAnchor={ editableContentElement } />;
	}

	// Render regular toolbar.
	return (
		<BlockControls group="inline">
			<FormatToolbar />
		</BlockControls>
	);
};

export default FormatToolbarContainer;

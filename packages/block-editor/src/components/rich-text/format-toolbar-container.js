/**
 * WordPress dependencies
 */
import { Popover, ToolbarGroup } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import {
	isCollapsed,
	getActiveFormats,
	useAnchor,
	store as richTextStore,
} from '@wordpress/rich-text';

/**
 * Internal dependencies
 */
import BlockControls from '../block-controls';
import FormatToolbar from './format-toolbar';
import { store as blockEditorStore } from '../../store';

function InlineSelectionToolbar( {
	value,
	editableContentElement,
	activeFormats,
} ) {
	const lastFormat = activeFormats[ activeFormats.length - 1 ];
	const lastFormatType = lastFormat?.type;
	const settings = useSelect(
		( select ) => select( richTextStore ).getFormatType( lastFormatType ),
		[ lastFormatType ]
	);
	const popoverAnchor = useAnchor( {
		editableContentElement,
		value,
		settings,
	} );

	return <InlineToolbar popoverAnchor={ popoverAnchor } />;
}

function InlineToolbar( { popoverAnchor } ) {
	return (
		<Popover
			position="top center"
			focusOnMount={ false }
			anchor={ popoverAnchor }
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

const FormatToolbarContainer = ( {
	inline,
	editableContentElement,
	value,
} ) => {
	const hasInlineToolbar = useSelect(
		( select ) => select( blockEditorStore ).getSettings().hasInlineToolbar,
		[]
	);

	if ( inline ) {
		return <InlineToolbar popoverAnchor={ editableContentElement } />;
	}

	if ( hasInlineToolbar ) {
		const activeFormats = getActiveFormats( value );

		if ( isCollapsed( value ) && ! activeFormats.length ) {
			return null;
		}

		return (
			<InlineSelectionToolbar
				editableContentElement={ editableContentElement }
				value={ value }
				activeFormats={ activeFormats }
			/>
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

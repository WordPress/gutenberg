/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Popover, ToolbarGroup } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import {
	isCollapsed,
	getActiveFormats,
	useAnchorRef,
	store as richTextStore,
} from '@wordpress/rich-text';

/**
 * Internal dependencies
 */
import BlockControls from '../block-controls';
import FormatToolbar from './format-toolbar';
import NavigableToolbar from '../navigable-toolbar';
import { store as blockEditorStore } from '../../store';

function InlineSelectionToolbar( {
	value,
	editableContentRef,
	activeFormats,
} ) {
	const lastFormat = activeFormats[ activeFormats.length - 1 ];
	const lastFormatType = lastFormat?.type;
	const settings = useSelect(
		( select ) => select( richTextStore ).getFormatType( lastFormatType ),
		[ lastFormatType ]
	);
	const popoverAnchor = useAnchorRef( {
		ref: editableContentRef,
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

const FormatToolbarContainer = ( { inline, editableContentRef, value } ) => {
	const hasInlineToolbar = useSelect(
		( select ) => select( blockEditorStore ).getSettings().hasInlineToolbar,
		[]
	);

	if ( inline ) {
		return <InlineToolbar popoverAnchor={ editableContentRef.current } />;
	}

	if ( hasInlineToolbar ) {
		const activeFormats = getActiveFormats( value );

		if ( isCollapsed( value ) && ! activeFormats.length ) {
			return null;
		}

		return (
			<InlineSelectionToolbar
				editableContentRef={ editableContentRef }
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

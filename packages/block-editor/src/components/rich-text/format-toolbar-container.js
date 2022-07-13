/**
 * WordPress dependencies
 */
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
import { store as blockEditorStore } from '../../store';

const FormatToolbarContainer = ( { inline, anchorRef, value } ) => {
	const hasInlineToolbar = useSelect(
		( select ) => select( blockEditorStore ).getSettings().hasInlineToolbar,
		[]
	);
	const activeFormats = getActiveFormats( value );
	const lastFormat = activeFormats[ activeFormats.length - 1 ];
	const lastFormatType = lastFormat?.type;
	const settings = useSelect(
		( select ) =>
			select( richTextStore ).getFormatType( lastFormatType ) || {},
		[ lastFormatType ]
	);
	const selectionRef = useAnchorRef( {
		ref: anchorRef,
		value,
		settings,
	} );

	if ( hasInlineToolbar || inline ) {
		if (
			hasInlineToolbar &&
			isCollapsed( value ) &&
			! activeFormats.length
		) {
			return null;
		}

		// Render in popover.
		return (
			<Popover
				position="bottom center"
				focusOnMount={ false }
				anchorRef={ hasInlineToolbar ? selectionRef : anchorRef }
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

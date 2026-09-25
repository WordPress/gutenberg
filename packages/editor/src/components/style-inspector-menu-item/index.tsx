import { MenuItem, Popover } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
// @ts-expect-error No exported types
import * as blockEditor from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import { unlock } from '../../lock-unlock';
import { store as editorStore } from '../../store';

const { privateApis: blockEditorPrivateApis, store: blockEditorStore } =
	blockEditor;
const {
	BlockStylesMenuItemsSlotFill,
	isStyleInspectorEnabled,
	StyleInspector,
	useBlockElement,
} = unlock( blockEditorPrivateApis );

/**
 * Adds "Inspect styles" to the block options menu, in the toolbar and in
 * List View, after Copy styles and Paste styles. It opens the style
 * inspector in a popover attached to the block. Like other popovers, it
 * closes with its close button, Escape, or a click elsewhere.
 */
export default function StyleInspectorMenuItem() {
	if ( ! isStyleInspectorEnabled() ) {
		return null;
	}
	return (
		<>
			<StyleInspectorMenuItemFill />
			<StyleInspectorPopover />
		</>
	);
}

function StyleInspectorMenuItemFill() {
	const { setIsStyleInspectorOpened } = unlock( useDispatch( editorStore ) );
	const { selectBlock } = useDispatch( blockEditorStore );

	return (
		<BlockStylesMenuItemsSlotFill.Fill>
			{ ( {
				clientId,
				onClose,
			}: {
				clientId: string;
				onClose: () => void;
			} ) => (
				<MenuItem
					aria-haspopup="dialog"
					onClick={ () => {
						selectBlock( clientId, null );
						setIsStyleInspectorOpened( true );
						onClose();
					} }
				>
					{ __( 'Inspect styles' ) }
				</MenuItem>
			) }
		</BlockStylesMenuItemsSlotFill.Fill>
	);
}

/**
 * The style inspector, in a popover attached to the selected block. The menu
 * that opens it closes on click, so the popover points at what it explains:
 * the block, like Highlight and Language point at the selected text.
 * Inspecting a parent selects it, which moves the popover to that block.
 */
function StyleInspectorPopover() {
	const editorDispatch = useDispatch( editorStore );
	const { isOpen, clientId } = useSelect(
		( select ) => ( {
			isOpen: unlock( select( editorStore ) ).isStyleInspectorOpened(),
			clientId: select( blockEditorStore ).getSelectedBlockClientId(),
		} ),
		[]
	);
	const blockElement = useBlockElement( isOpen ? clientId : null );

	if ( ! isOpen || ! clientId || ! blockElement ) {
		return null;
	}

	const close = () =>
		unlock( editorDispatch ).setIsStyleInspectorOpened( false );

	return (
		<Popover
			// A new block is a new dialog: remounting moves focus into it,
			// rather than leaving it on the Inspect button that just
			// unmounted, so a click elsewhere still closes it.
			key={ clientId }
			className="editor-style-inspector-popover"
			anchor={ blockElement }
			placement="bottom-start"
			shift
			resize
			focusOnMount="firstElement"
			onClose={ close }
			role="dialog"
			aria-label={ __( 'Block styles' ) }
		>
			<StyleInspector clientId={ clientId } onClose={ close } />
		</Popover>
	);
}

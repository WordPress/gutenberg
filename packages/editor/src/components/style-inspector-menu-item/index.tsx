import { MenuItem, Popover } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
// @ts-expect-error No exported types
import * as blockEditor from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import { unlock } from '../../lock-unlock';
import { store as editorStore } from '../../store';

const {
	BlockSettingsMenuControls,
	privateApis: blockEditorPrivateApis,
	store: blockEditorStore,
} = blockEditor;
const { isStyleInspectorEnabled, StyleInspector, useBlockElement } = unlock(
	blockEditorPrivateApis
);

/**
 * Adds "Inspect styles" to the block options menu, in the toolbar and in
 * List View. It opens the style inspector in a popover attached to the
 * block, and reads "Hide styles" while the popover is open.
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
	const isOpen = useSelect(
		( select ) => unlock( select( editorStore ) ).isStyleInspectorOpened(),
		[]
	);

	return (
		<BlockSettingsMenuControls>
			{ ( {
				selectedClientIds,
				onClose,
			}: {
				selectedClientIds: string[];
				onClose: () => void;
			} ) =>
				selectedClientIds.length === 1 && (
					<MenuItem
						aria-haspopup="dialog"
						onClick={ () => {
							if ( isOpen ) {
								setIsStyleInspectorOpened( false );
							} else {
								selectBlock( selectedClientIds[ 0 ], null );
								setIsStyleInspectorOpened( true );
							}
							onClose();
						} }
					>
						{ isOpen
							? __( 'Hide styles' )
							: __( 'Inspect styles' ) }
					</MenuItem>
				)
			}
		</BlockSettingsMenuControls>
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

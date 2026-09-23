import { MenuItem } from '@wordpress/components';
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
const { isStyleInspectorEnabled } = unlock( blockEditorPrivateApis );

/**
 * Adds "Inspect styles" to the block options menu, in the toolbar and in
 * List View. It opens List View with the style inspector under the block,
 * and reads "Hide styles" while the inspector is open.
 */
export default function StyleInspectorMenuItem() {
	if ( ! isStyleInspectorEnabled() ) {
		return null;
	}
	return <StyleInspectorMenuItemFill />;
}

function StyleInspectorMenuItemFill() {
	const { setIsListViewOpened } = useDispatch( editorStore );
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
						onClick={ () => {
							if ( isOpen ) {
								setIsStyleInspectorOpened( false );
							} else {
								selectBlock( selectedClientIds[ 0 ], null );
								setIsListViewOpened( true );
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

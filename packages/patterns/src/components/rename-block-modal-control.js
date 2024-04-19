/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import {
	store as blockEditorStore,
	useBlockDisplayInformation,
	privateApis as blockEditorPrivateApis,
} from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { store as patternsStore } from '../store';
import { unlock } from '../lock-unlock';
import { PATTERN_OVERRIDES_BINDING_SOURCE } from '../constants';

const { BlockRenameModal } = unlock( blockEditorPrivateApis );

function BlockRenameModalWrapper( { clientId } ) {
	const { metadata } = useSelect(
		( select ) => {
			const { getBlockAttributes } = select( blockEditorStore );
			const attributes = getBlockAttributes( clientId );
			return {
				metadata: attributes?.metadata,
			};
		},
		[ clientId ]
	);
	const { updateBlockAttributes } = useDispatch( blockEditorStore );
	const { setRenamingBlock } = unlock( useDispatch( patternsStore ) );
	const blockInformation = useBlockDisplayInformation( clientId );
	const customName = metadata?.name ?? '';
	const hasPatternOverrides =
		!! customName &&
		!! metadata?.bindings &&
		Object.values( metadata.bindings ).some(
			( binding ) => binding.source === PATTERN_OVERRIDES_BINDING_SOURCE
		);

	const closeModal = () => setRenamingBlock( null );
	const onRename = ( newName ) => {
		// If the new value is the block's original name (e.g. `Group`)
		// or it is an empty string then assume the intent is to reset
		// the value. Therefore reset the metadata.
		if ( newName === blockInformation?.title || ! newName.trim() ) {
			newName = undefined;
		}

		updateBlockAttributes( [ clientId ], {
			metadata: {
				...metadata,
				name: newName,
			},
		} );
	};

	return (
		<BlockRenameModal
			blockName={ customName }
			originalBlockName={ blockInformation?.title }
			helpText={
				hasPatternOverrides
					? __(
							'This block allows overrides. Changing the name can cause problems with content entered into instances of this pattern.'
					  )
					: undefined
			}
			onClose={ closeModal }
			onSave={ onRename }
		/>
	);
}

// Split into a different component to minimize the store subscriptions.
export default function RenameBlockModalControl() {
	const { renamingBlockClientId } = useSelect(
		( select ) => ( {
			renamingBlockClientId: unlock(
				select( patternsStore )
			).getRenamingBlockClientId(),
		} ),
		[]
	);
	if ( ! renamingBlockClientId ) return null;

	return <BlockRenameModalWrapper clientId={ renamingBlockClientId } />;
}

/**
 * WordPress dependencies
 */
import { MenuItem } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import { useBlockDisplayInformation } from '..';
import isEmptyString from './is-empty-string';
import BlockRenameModal from './modal';

export default function BlockRenameControl( { clientId } ) {
	const [ renamingBlock, setRenamingBlock ] = useState( false );

	const { metadata } = useSelect(
		( select ) => {
			const { getBlockAttributes } = select( blockEditorStore );

			const _metadata = getBlockAttributes( clientId )?.metadata;
			return {
				metadata: _metadata,
			};
		},
		[ clientId ]
	);

	const { updateBlockAttributes } = useDispatch( blockEditorStore );

	const customName = metadata?.name;
	const hasPatternOverrides =
		!! customName &&
		!! metadata?.bindings &&
		Object.values( metadata.bindings ).some(
			( binding ) => binding.source === 'core/pattern-overrides'
		);

	function onChange( newName ) {
		updateBlockAttributes( [ clientId ], {
			metadata: {
				...metadata,
				name: newName,
			},
		} );
	}

	const blockInformation = useBlockDisplayInformation( clientId );

	return (
		<>
			<MenuItem
				onClick={ () => {
					setRenamingBlock( true );
				} }
				aria-expanded={ renamingBlock }
				aria-haspopup="dialog"
			>
				{ __( 'Rename' ) }
			</MenuItem>
			{ renamingBlock && (
				<BlockRenameModal
					blockName={ customName || '' }
					originalBlockName={ blockInformation?.title }
					hasOverridesWarning={ hasPatternOverrides }
					onClose={ () => setRenamingBlock( false ) }
					onSave={ ( newName ) => {
						// If the new value is the block's original name (e.g. `Group`)
						// or it is an empty string then assume the intent is to reset
						// the value. Therefore reset the metadata.
						if (
							newName === blockInformation?.title ||
							isEmptyString( newName )
						) {
							newName = undefined;
						}

						onChange( newName );
					} }
				/>
			) }
		</>
	);
}

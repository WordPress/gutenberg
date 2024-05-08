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
import { unlock } from '../../lock-unlock';
import { store as blockEditorStore } from '../../store';
import { useBlockDisplayInformation } from '..';
import isEmptyString from './is-empty-string';
import BlockRenameModal from './modal';

export default function BlockRenameControl( { clientId } ) {
	const [ renamingBlock, setRenamingBlock ] = useState( false );

	const { metadata, onRenameBlock } = useSelect(
		( select ) => {
			const { getBlockAttributes, getSettings } =
				select( blockEditorStore );
			const settings = getSettings();
			// Try unlocking the settings if it has been locked, otherwise renameBlock is not set.
			let renameBlock;
			try {
				renameBlock = unlock( settings ).renameBlock;
			} catch ( err ) {
				renameBlock = undefined;
			}

			const _metadata = getBlockAttributes( clientId )?.metadata;
			return {
				metadata: _metadata,
				// Custom extended rename block function.
				onRenameBlock: renameBlock,
			};
		},
		[ clientId ]
	);

	const { updateBlockAttributes } = useDispatch( blockEditorStore );

	const customName = metadata?.name;

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
					if ( onRenameBlock ) {
						onRenameBlock( clientId );
					} else {
						setRenamingBlock( true );
					}
				} }
				aria-haspopup="dialog"
			>
				{ __( 'Rename' ) }
			</MenuItem>
			{ renamingBlock && (
				<BlockRenameModal
					blockName={ customName || '' }
					originalBlockName={ blockInformation?.title }
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

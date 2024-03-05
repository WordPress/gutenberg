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
import {
	BLOCK_BINDINGS_ALLOWED_BLOCKS,
	canBindBlock,
	addBindings,
	removeBindings,
} from '../../hooks/use-bindings-attributes';

export default function BlockRenameControl( { clientId } ) {
	const [ renamingBlock, setRenamingBlock ] = useState( false );

	const { metadata, blockName } = useSelect(
		( select ) => {
			const { getBlockAttributes, getBlockName } =
				select( blockEditorStore );

			const _metadata = getBlockAttributes( clientId )?.metadata;
			return {
				metadata: _metadata,
				blockName: getBlockName( clientId ),
			};
		},
		[ clientId ]
	);

	const { updateBlockAttributes } = useDispatch( blockEditorStore );

	const customName = metadata?.name;
	const hasPatternOverrides =
		!! metadata?.bindings &&
		!! BLOCK_BINDINGS_ALLOWED_BLOCKS[ blockName ]?.every(
			( attributeName ) =>
				metadata.bindings[ attributeName ]?.source ===
				'core/pattern-overrides'
		);

	function onChange( newName, allowOverrides ) {
		const updatedMetadata = { ...metadata, name: newName };
		if ( allowOverrides !== undefined && canBindBlock( blockName ) ) {
			const syncedAttributes = BLOCK_BINDINGS_ALLOWED_BLOCKS[ blockName ];
			updatedMetadata.bindings = allowOverrides
				? addBindings(
						updatedMetadata.bindings,
						syncedAttributes,
						'core/pattern-overrides'
				  )
				: removeBindings(
						updatedMetadata.bindings,
						syncedAttributes,
						'core/pattern-overrides'
				  );
		}

		updateBlockAttributes( [ clientId ], {
			metadata: updatedMetadata,
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
					initialAllowOverrides={ hasPatternOverrides }
					onClose={ () => setRenamingBlock( false ) }
					onSave={ ( newName, allowOverrides ) => {
						// If the new value is the block's original name (e.g. `Group`)
						// or it is an empty string then assume the intent is to reset
						// the value. Therefore reset the metadata.
						if (
							newName === blockInformation?.title ||
							isEmptyString( newName )
						) {
							newName = undefined;
						}

						onChange( newName, allowOverrides );
					} }
				/>
			) }
		</>
	);
}

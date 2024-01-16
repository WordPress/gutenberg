/**
 * WordPress dependencies
 */
import { privateApis as componentsPrivateApis } from '@wordpress/components';
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
import { unlock } from '../../lock-unlock';

const {
	DropdownMenuItemV2: DropdownMenuItem,
	DropdownMenuItemLabelV2: DropdownMenuItemLabel,
} = unlock( componentsPrivateApis );

/* TODO: check if this used in other legacy dropdown menus */
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

	function onChange( newName ) {
		updateBlockAttributes( [ clientId ], {
			metadata: {
				...( metadata && metadata ),
				name: newName,
			},
		} );
	}

	const blockInformation = useBlockDisplayInformation( clientId );

	return (
		<>
			<DropdownMenuItem
				onClick={ () => {
					setRenamingBlock( true );
				} }
				hideOnClick={ false }
				aria-expanded={ renamingBlock }
				aria-haspopup="dialog"
			>
				<DropdownMenuItemLabel>
					{ __( 'Rename' ) }
				</DropdownMenuItemLabel>
			</DropdownMenuItem>
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

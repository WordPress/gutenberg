/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import { createBlock, getBlockType, parse } from '@wordpress/blocks';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { store as blockDirectoryStore } from '../../store';

export default function InstallButton( { attributes, block, clientId } ) {
	const isInstallingBlock = useSelect(
		( select ) => select( blockDirectoryStore ).isInstalling( block.id ),
		[ block.id ]
	);
	const { installBlockType } = useDispatch( blockDirectoryStore );
	const { replaceBlock } = useDispatch( blockEditorStore );

	return (
		<Button
			onClick={ () =>
				installBlockType( block ).then( ( success ) => {
					if ( success ) {
						const blockType = getBlockType( block.name );
						const [ originalBlock ] = parse(
							attributes.originalContent
						);
						if ( originalBlock && blockType ) {
							replaceBlock(
								clientId,
								createBlock(
									blockType.name,
									originalBlock.attributes,
									originalBlock.innerBlocks
								)
							);
						}
					}
				} )
			}
			disabled={ isInstallingBlock }
			isBusy={ isInstallingBlock }
			variant="primary"
		>
			{ sprintf(
				/* translators: %s: block name */
				__( 'Install %s' ),
				block.title
			) }
		</Button>
	);
}

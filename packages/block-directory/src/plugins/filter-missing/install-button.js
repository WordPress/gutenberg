/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import {
	createBlock,
	getBlockAttributes,
	getBlockType,
} from '@wordpress/blocks';

export default function InstallButton( { attributes, block, clientId } ) {
	const isInstallingBlock = useSelect( ( select ) =>
		select( 'core/block-directory' ).isInstalling( block.id )
	);
	const { installBlockType } = useDispatch( 'core/block-directory' );
	const { replaceBlock } = useDispatch( 'core/block-editor' );

	return (
		<Button
			onClick={ () =>
				installBlockType( block ).then( ( success ) => {
					if ( success ) {
						const blockType = getBlockType( block.name );
						const oldAttributes = getBlockAttributes(
							blockType,
							attributes.originalUndelimitedContent
						);
						replaceBlock(
							clientId,
							createBlock( blockType.name, oldAttributes )
						);
					}
				} )
			}
			disabled={ isInstallingBlock }
			isBusy={ isInstallingBlock }
			isPrimary
		>
			{ sprintf(
				/* translators: %s: block name */
				__( 'Install %s' ),
				block.title
			) }
		</Button>
	);
}

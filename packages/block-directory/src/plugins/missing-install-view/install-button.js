/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';

export default function InstallButton( { blockName, convertToBlock } ) {
	const { block, isInstallingBlock, isSearching } = useSelect(
		( select ) => {
			const {
				getDownloadableBlocks,
				isInstalling,
				isRequestingDownloadableBlocks,
			} = select( 'core/block-directory' );
			const blocks = getDownloadableBlocks( blockName ).filter(
				( { name } ) => blockName === name
			);
			return {
				isSearching: isRequestingDownloadableBlocks(),
				isInstallingBlock: isInstalling(),
				block: blocks.length && blocks[ 0 ],
			};
		},
		[ blockName ]
	);
	const { installBlockType } = useDispatch( 'core/block-directory' );

	return (
		<>
			{ ! isSearching && !! block && (
				<Button
					onClick={ () =>
						installBlockType( block ).then( ( success ) => {
							if ( success ) {
								convertToBlock( block.name );
							}
						} )
					}
					disabled={ isInstallingBlock }
					isBusy={ isInstallingBlock }
					isLarge
					isPrimary
				>
					{ __( 'Reinstall block' ) }
				</Button>
			) }
			<Button
				onClick={ () => convertToBlock( 'core/html' ) }
				isLarge
				isPrimary={ ! block }
			>
				{ __( 'Keep as HTML' ) }
			</Button>
		</>
	);
}

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import { decodeEntities } from '@wordpress/html-entities';

/**
 * Internal dependencies
 */
import BlockRatings from '../block-ratings';
import DownloadableBlockIcon from '../downloadable-block-icon';

function DownloadableBlockHeader( {
	icon,
	title,
	rating,
	ratingCount,
	isLoading = false,
	isInstallable = true,
	onClick,
} ) {
	return (
		<div className="block-directory-downloadable-block-header__row">
			<DownloadableBlockIcon icon={ icon } title={ title } />

			<div className="block-directory-downloadable-block-header__column">
				<h2 className="block-directory-downloadable-block-header__title">
					{ decodeEntities( title ) }
				</h2>
				<BlockRatings rating={ rating } ratingCount={ ratingCount } />
			</div>
			<Button
				isSecondary
				isBusy={ isLoading }
				disabled={ isLoading || ! isInstallable }
				onClick={ ( event ) => {
					event.preventDefault();
					if ( ! isLoading && isInstallable ) {
						onClick();
					}
				} }
			>
				{ isLoading ? __( 'Adding…' ) : __( 'Add block' ) }
			</Button>
		</div>
	);
}

export default DownloadableBlockHeader;

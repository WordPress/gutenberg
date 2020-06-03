/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import { withSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import BlockRatings from '../block-ratings';
import DownloadableBlockIcon from '../downloadable-block-icon';

export function DownloadableBlockHeader( {
	icon,
	title,
	rating,
	ratingCount,
	isLoading,
	onClick,
} ) {
	return (
		<div className="block-directory-downloadable-block-header__row">
			<DownloadableBlockIcon icon={ icon } title={ title } />

			<div className="block-directory-downloadable-block-header__column">
				<h2 className="block-directory-downloadable-block-header__title">
					{ title }
				</h2>
				<BlockRatings rating={ rating } ratingCount={ ratingCount } />
			</div>
			<Button
				isSecondary
				isBusy={ isLoading }
				disabled={ isLoading }
				onClick={ ( event ) => {
					event.preventDefault();
					if ( ! isLoading ) {
						onClick();
					}
				} }
			>
				{ isLoading ? __( 'Adding…' ) : __( 'Add block' ) }
			</Button>
		</div>
	);
}

export default withSelect( ( select ) => {
	return {
		isLoading: select( 'core/block-directory' ).isInstalling(),
	};
} )( DownloadableBlockHeader );

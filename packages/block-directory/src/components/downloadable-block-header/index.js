/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { BlockIcon } from '@wordpress/block-editor';
import BlockRatings from '../block-ratings';

function DownloadableBlockHeader( { icon, title, rating, ratingCount, onClick } ) {
	return (
		<div className="block-directory-downloadable-block-header__row">
			{
				icon.match( /\.(jpeg|jpg|gif|png)$/ ) !== null ?
					<img src={ icon } alt="block icon" /> :
					<span >
						<BlockIcon icon={ icon } showColors />
					</span>
			}

			<div className="block-directory-downloadable-block-header__column">
				<span role="heading" className="block-directory-downloadable-block-header__title" >
					{ title }
				</span>
				<BlockRatings rating={ rating } ratingCount={ ratingCount } />
			</div>
			<Button
				isDefault
				onClick={ ( event ) => {
					event.preventDefault();
					onClick();
				} }
			>
				{ __( 'Add' ) }
			</Button>
		</div>
	);
}

export default DownloadableBlockHeader;

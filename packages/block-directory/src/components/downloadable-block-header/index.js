/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { BlockIcon } from '@wordpress/block-editor';
import BlockRatings from '../block-ratings';

function DownloadableBlockHeader( {
	icon,
	title,
	rating,
	ratingCount,
	onClick,
} ) {
	return (
		<div className="block-directory-downloadable-block-header__row">
			{ icon.match( /\.(jpeg|jpg|gif|png)(?:\?.*)?$/ ) !== null ? (
				// translators: %s: Name of the plugin e.g: "Akismet".
				<img
					src={ icon }
					alt={ sprintf( __( '%s block icon' ), title ) }
				/>
			) : (
				<span>
					<BlockIcon icon={ icon } showColors />
				</span>
			) }

			<div className="block-directory-downloadable-block-header__column">
				<span
					role="heading"
					className="block-directory-downloadable-block-header__title"
				>
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
				{ __( 'Add block' ) }
			</Button>
		</div>
	);
}

export default DownloadableBlockHeader;

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import { withSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { BlockIcon } from '@wordpress/block-editor';
import BlockRatings from '../block-ratings';

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
			{ icon.match( /\.(jpeg|jpg|gif|png)(?:\?.*)?$/ ) !== null ? (
				<img
					src={ icon }
					alt={ sprintf(
						// translators: %s: Name of the plugin e.g: "Akismet".
						__( '%s block icon' ),
						title
					) }
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
				isSecondary
				isBusy={ isLoading }
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

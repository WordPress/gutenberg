/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import BlockIcon from '../block-icon';
import BlockRatings from '../block-ratings';

function DiscoverBlockHeader( { icon, title, rating, ratingCount, onClick } ) {
	return (
		<Fragment>
			<div className="block-editor-discover-block-header__row">
				{
					icon.match( /\.(jpeg|jpg|gif|png)/ ) !== null ?
						<img src={ icon } alt="block icon" /> :
						<span >
							<BlockIcon icon={ icon } showColors />
						</span>
				}

				<div className="block-editor-discover-block-header__column">
					<span className="block-editor-discover-block-header__title">
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
		</Fragment>
	);
}

export default DiscoverBlockHeader;

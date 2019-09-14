/**
 * WordPress dependencies
 */
import { _n, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Stars from './stars';

export const BlockRatings = ( { rating, ratingCount } ) => (
	<div className="block-directory-block-ratings">
		<Stars rating={ rating } />
		<span
			className="block-directory-block-ratings__rating-count"
			aria-label={
				// translators: %d: number of ratings (number).
				sprintf( _n( '%d total rating', '%d total ratings', ratingCount ), ratingCount )
			}
		>
			({ ratingCount })
		</span>
	</div>
);

export default BlockRatings;

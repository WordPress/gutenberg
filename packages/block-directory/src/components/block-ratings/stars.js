/**
 * External dependencies
 */
import { times } from 'lodash';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { Icon, starEmpty, starFilled, starHalf } from '@wordpress/icons';

function Stars( { rating } ) {
	const stars = Math.round( rating / 0.5 ) * 0.5;

	const fullStarCount = Math.floor( rating );
	const halfStarCount = Math.ceil( rating - fullStarCount );
	const emptyStarCount = 5 - ( fullStarCount + halfStarCount );

	return (
		<span
			aria-label={ sprintf(
				/* translators: %s: number of stars. */
				__( '%s out of 5 stars' ),
				stars
			) }
		>
			{ times( fullStarCount, ( i ) => (
				<Icon
					key={ `full_stars_${ i }` }
					className="block-directory-block-ratings__star-full"
					icon={ starFilled }
					size={ 16 }
				/>
			) ) }
			{ times( halfStarCount, ( i ) => (
				<Icon
					key={ `half_stars_${ i }` }
					className="block-directory-block-ratings__star-half-full"
					icon={ starHalf }
					size={ 16 }
				/>
			) ) }
			{ times( emptyStarCount, ( i ) => (
				<Icon
					key={ `empty_stars_${ i }` }
					className="block-directory-block-ratings__star-empty"
					icon={ starEmpty }
					size={ 16 }
				/>
			) ) }
		</span>
	);
}

export default Stars;

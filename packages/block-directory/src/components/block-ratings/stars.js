/**
 * External dependencies
 */
import { times } from 'lodash';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { Icon } from '@wordpress/components';

function Stars( { rating } ) {
	const stars = Math.round( rating / 0.5 ) * 0.5;

	const fullStarCount = Math.floor( rating );
	const halfStarCount = Math.ceil( rating - fullStarCount );
	const emptyStarCount = 5 - ( fullStarCount + halfStarCount );

	return (
		<div aria-label={ sprintf( __( '%s out of 5 stars' ), stars ) }>
			{ times( fullStarCount, ( i ) => (
				<Icon
					key={ `full_stars_${ i }` }
					icon="star-filled"
					size={ 16 }
				/>
			) ) }
			{ times( halfStarCount, ( i ) => (
				<Icon
					key={ `half_stars_${ i }` }
					icon="star-half"
					size={ 16 }
				/>
			) ) }
			{ times( emptyStarCount, ( i ) => (
				<Icon
					key={ `empty_stars_${ i }` }
					icon="star-empty"
					size={ 16 }
				/>
			) ) }
		</div>
	);
}

export default Stars;

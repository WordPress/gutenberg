/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { Icon } from '@wordpress/components';

/**
 * Internal dependencies
 */

function Stars( {
	rating,
} ) {
	let counter = rating * 2;
	const items = [];

	for ( let i = 0; i < 5; i++ ) {
		switch ( counter ) {
			case 0:
				items.push( <Icon key={ i } icon={ 'star-empty' } size={ 16 }></Icon> );
				break;

			case 1:
				items.push( <Icon key={ i } icon={ 'star-half' } size={ 16 }></Icon> );
				counter--;
				break;

			default:
				items.push( <Icon key={ i } icon={ 'star-filled' } size={ 16 }></Icon> );
				counter -= 2;
		}
	}

	const stars = Math.round( rating / 0.5 ) * 0.5;

	return (
		<div aria-label={ sprintf( __( '%s out of 5 stars', stars ), stars ) } >
			{ items }
		</div>
	);
}

export default Stars;

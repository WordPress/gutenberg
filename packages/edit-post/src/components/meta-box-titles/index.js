/**
 * External dependencies
 */
import { map } from 'lodash';

/**
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';
import { withSelect } from '@wordpress/data';

function MetaBoxTitles( { titles, titleWrapper } ) {
	return map( titles, ( title, id ) => (
		<Fragment key={ id }>{ titleWrapper( title, id ) }</Fragment>
	) );
}

export default withSelect( ( select ) => ( {
	titles: select( 'core/edit-post' ).getMetaBoxTitles(),
} ) )( MetaBoxTitles );

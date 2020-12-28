/**
 * WordPress dependencies
 */
import { withSelect } from '@wordpress/data';
import { compose } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import PostAuthorCombobox from './post-author-combobox';
import PostAuthorSelect from './post-author-select';

const minimumUsersForCombobox = 25;

function PostAuthor( { authors } ) {
	if ( authors?.length >= minimumUsersForCombobox ) {
		return <PostAuthorCombobox />;
	}
	return <PostAuthorSelect />;
}

export default compose( [
	withSelect( ( select ) => {
		return {
			authors: select( 'core' ).getUsers( {
				who: 'authors',
				per_page: minimumUsersForCombobox + 1,
			} ),
		};
	} ),
] )( PostAuthor );

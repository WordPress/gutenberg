/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import PostAuthorCombobox from './combobox';
import PostAuthorSelect from './select';

const minimumUsersForCombobox = 25;

function PostAuthor() {
	const showCombobox = useSelect( ( select ) => {
		const authors = select( 'core' ).getUsers( {
			who: 'authors',
			per_page: minimumUsersForCombobox + 1,
		} );
		return authors?.length >= minimumUsersForCombobox;
	}, [] );

	if ( showCombobox ) {
		return <PostAuthorCombobox />;
	}
	return <PostAuthorSelect />;
}

export default PostAuthor;

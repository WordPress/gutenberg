/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import PostAuthorCombobox from './combobox';
import PostAuthorSelect from './select';

const minimumUsersForCombobox = 25;

function PostAuthor() {
	const showCombobox = useSelect( ( select ) => {
		// Not using `getUsers()` because it requires `list_users` capability.
		const authors = select( coreStore ).getAuthors();
		return authors?.length >= minimumUsersForCombobox;
	}, [] );

	if ( showCombobox ) {
		return <PostAuthorCombobox />;
	}
	return <PostAuthorSelect />;
}

export default PostAuthor;

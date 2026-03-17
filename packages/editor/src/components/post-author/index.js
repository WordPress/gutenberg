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
import { AUTHORS_QUERY } from './constants';

const minimumUsersForCombobox = 25;

/**
 * Renders the component for selecting the post author.
 *
 * @return {React.ReactNode} The rendered component.
 */
function PostAuthor() {
	const showCombobox = useSelect( ( select ) => {
		const authors = select( coreStore ).getUsers( AUTHORS_QUERY );

		return authors?.length >= minimumUsersForCombobox;
	}, [] );

	if ( showCombobox ) {
		return <PostAuthorCombobox />;
	}
	return <PostAuthorSelect />;
}

export default PostAuthor;

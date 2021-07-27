/**
 * External dependencies
 */
import { get } from 'lodash';

/**
 * WordPress dependencies
 */
import { withInstanceId, compose } from '@wordpress/compose';
import { withSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import PostTypeSupportCheck from '../post-type-support-check';
import { store as editorStore } from '../../store';
import { AUTHORS_QUERY } from './constants';

export function PostAuthorCheck( {
	hasAssignAuthorAction,
	hasAuthors,
	children,
} ) {
	if ( ! hasAssignAuthorAction || ! hasAuthors ) {
		return null;
	}

	return (
		<PostTypeSupportCheck supportKeys="author">
			{ children }
		</PostTypeSupportCheck>
	);
}

export default compose( [
	withSelect( ( select ) => {
		const post = select( editorStore ).getCurrentPost();
		const authors = select( coreStore ).getUsers( AUTHORS_QUERY );
		return {
			hasAssignAuthorAction: get(
				post,
				[ '_links', 'wp:action-assign-author' ],
				false
			),
			hasAuthors: authors?.length >= 1,
		};
	} ),
	withInstanceId,
] )( PostAuthorCheck );

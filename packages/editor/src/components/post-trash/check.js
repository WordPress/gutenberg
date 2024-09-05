/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import { store as editorStore } from '../../store';
import trashPost from '../../dataviews/actions/trash-post';

/**
 * Wrapper component that renders its children only if the post can trashed.
 *
 * @param {Object}  props          - The component props.
 * @param {Element} props.children - The child components to render.
 *
 * @return {Component|null} The rendered child components or null if the post can not trashed.
 */
export default function PostTrashCheck( { children } ) {
	const { item, permissions } = useSelect( ( select ) => {
		const store = select( editorStore );
		const { getEditedEntityRecord, getEntityRecordPermissions } = unlock(
			select( coreStore )
		);
		const postId = store.getCurrentPostId();
		const _postType = store.getCurrentPostType();
		return {
			item: getEditedEntityRecord( 'postType', _postType, postId ),
			permissions: getEntityRecordPermissions(
				'postType',
				_postType,
				postId
			),
		};
	}, [] );
	const itemWithPermissions = useMemo( () => {
		return {
			...item,
			permissions,
		};
	}, [ item, permissions ] );
	if (
		! itemWithPermissions ||
		! trashPost.isEligible( itemWithPermissions )
	) {
		return null;
	}
	return children;
}

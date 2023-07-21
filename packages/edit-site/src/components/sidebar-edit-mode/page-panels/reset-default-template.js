/**
 * WordPress dependencies
 */
import { useDispatch } from '@wordpress/data';
import { MenuGroup, MenuItem } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useEntityRecord } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import {
	useCurrentTemplateSlug,
	useEditedPostContext,
	useIsPostsPage,
} from './hooks';
import { store as editSiteStore } from '../../../store';

export default function ResetDefaultTemplate( { onClick } ) {
	const currentTemplateSlug = useCurrentTemplateSlug();
	const isPostsPage = useIsPostsPage();
	const { postType, postId } = useEditedPostContext();
	const entitiy = useEntityRecord( 'postType', postType, postId );
	const { setPage } = useDispatch( editSiteStore );
	// The default template in a post is indicated by an empty string.
	if ( ! currentTemplateSlug || isPostsPage ) {
		return null;
	}
	return (
		<MenuGroup>
			<MenuItem
				onClick={ async () => {
					entitiy.edit( { template: '' }, { undoIgnore: true } );
					onClick();
					await setPage( {
						context: { postType, postId },
					} );
				} }
			>
				{ __( 'Reset' ) }
			</MenuItem>
		</MenuGroup>
	);
}

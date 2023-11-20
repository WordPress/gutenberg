/**
 * WordPress dependencies
 */
import { MenuGroup, MenuItem } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import {
	useCurrentTemplateSlug,
	useEditedPostContext,
	useIsPostsPage,
} from './hooks';

export default function ResetDefaultTemplate( { onClick } ) {
	const currentTemplateSlug = useCurrentTemplateSlug();
	const isPostsPage = useIsPostsPage();
	const { postType, postId } = useEditedPostContext();
	const { editEntityRecord } = useDispatch( coreStore );
	// The default template in a post is indicated by an empty string.
	if ( ! currentTemplateSlug || isPostsPage ) {
		return null;
	}
	return (
		<MenuGroup>
			<MenuItem
				onClick={ async () => {
					editEntityRecord(
						'postType',
						postType,
						postId,
						{ template: '' },
						{ undoIgnore: true }
					);
					onClick();
				} }
			>
				{ __( 'Use default template' ) }
			</MenuItem>
		</MenuGroup>
	);
}

/**
 * WordPress dependencies
 */
import { MenuGroup, MenuItem } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useEntityRecord } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { useCurrentTemplateSlug, useIsPostsPage } from './hooks';

export default function ResetDefaultTemplate( { onClick, context } ) {
	const currentTemplateSlug = useCurrentTemplateSlug( context );
	const isPostsPage = useIsPostsPage( context?.postId );
	const { postType, postId } = context;
	const entity = useEntityRecord( 'postType', postType, postId );
	// The default template in a post is indicated by an empty string.
	if ( ! currentTemplateSlug || isPostsPage ) {
		return null;
	}
	return (
		<MenuGroup>
			<MenuItem
				onClick={ async () => {
					entity.edit( { template: '' }, { undoIgnore: true } );
					onClick();
				} }
			>
				{ __( 'Use default template' ) }
			</MenuItem>
		</MenuGroup>
	);
}

/**
 * WordPress dependencies
 */
import { useRef, useEffect } from '@wordpress/element';
import { EntityProvider } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import useTemplatePartPost from './use-template-part-post';
import TemplatePartInnerBlocks from './inner-blocks';
import TemplatePartPlaceholder from './placeholder';

export default function TemplatePartEdit( {
	attributes: { postId: _postId, slug, theme },
	setAttributes,
} ) {
	const initialPostId = useRef( _postId );
	const initialSlug = useRef( slug );
	const initialTheme = useRef( theme );

	// Resolve the post ID if not set, and load its post.
	const postId = useTemplatePartPost( _postId, slug, theme );

	// Set the post ID, once found, so that edits persist.
	useEffect( () => {
		if (
			( initialPostId.current === undefined || initialPostId.current === null ) &&
			postId !== undefined &&
			postId !== null
		) {
			setAttributes( { postId } );
		}
	}, [ postId ] );

	if ( postId ) {
		// Part of a template file, post ID already resolved.
		return (
			<EntityProvider kind="postType" type="wp_template_part" id={ postId }>
				<TemplatePartInnerBlocks />
			</EntityProvider>
		);
	}
	if ( ! initialSlug.current && ! initialTheme.current ) {
		// Fresh new block.
		return <TemplatePartPlaceholder setAttributes={ setAttributes } />;
	}
	// Part of a template file, post ID not resolved yet.
	return null;
}

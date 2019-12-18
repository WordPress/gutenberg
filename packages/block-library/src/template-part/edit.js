/**
 * WordPress dependencies
 */
import { useEntityBlockEditor, EntityProvider } from '@wordpress/core-data';
import { InnerBlocks } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { useRef, useEffect } from '@wordpress/element';

function TemplatePart() {
	const [ blocks, onInput, onChange ] = useEntityBlockEditor(
		'postType',
		'wp_template_part',
		{
			initialEdits: { status: 'publish' },
		}
	);
	return <InnerBlocks blocks={ blocks } onInput={ onInput } onChange={ onChange } />;
}

export default function TemplatePartEdit( {
	attributes: { postId: _postId, slug, theme },
	setAttributes,
} ) {
	const postId = useSelect(
		( select ) => {
			if ( _postId ) {
				// This is already a custom template part,
				// use its CPT post.
				return (
					select( 'core' ).getEntityRecord(
						'postType',
						'wp_template_part',
						_postId
					) && _postId
				);
			}

			// This is not a custom template part,
			// load the auto-draft created from the
			// relevant file.
			const posts = select( 'core' ).getEntityRecords(
				'postType',
				'wp_template_part',
				{
					status: 'auto-draft',
					slug,
					meta: { theme },
				}
			);

			return posts && posts[ 0 ].id;
		},
		[ _postId, slug, theme ]
	);

	// Set the post ID, once found, so that edits persist.
	const initialPostId = useRef( _postId );
	useEffect( () => {
		if (
			( initialPostId.current === undefined || initialPostId.current === null ) &&
			postId !== undefined &&
			postId !== null
		) {
			setAttributes( { postId } );
		}
	}, [ postId ] );
	return postId ? (
		<EntityProvider kind="postType" type="wp_template_part" id={ postId }>
			<TemplatePart />
		</EntityProvider>
	) : null;
}

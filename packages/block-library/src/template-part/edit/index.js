/**
 * WordPress dependencies
 */
import { useRef, useEffect } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import {
	BlockControls,
	__experimentalBlock as Block,
} from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import useTemplatePartPost from './use-template-part-post';
import TemplatePartNamePanel from './name-panel';
import TemplatePartInnerBlocks from './inner-blocks';
import TemplatePartPlaceholder from './placeholder';

export default function TemplatePartEdit( {
	attributes: { postId: _postId, slug, theme, tagName },
	setAttributes,
	clientId,
} ) {
	const initialPostId = useRef( _postId );
	const initialSlug = useRef( slug );
	const initialTheme = useRef( theme );

	// Resolve the post ID if not set, and load its post.
	const postId = useTemplatePartPost( _postId, slug, theme );

	// Set the post ID, once found, so that edits persist,
	// but wait until the third inner blocks change,
	// because the first 2 are just the template part
	// content loading.
	const { innerBlocks } = useSelect(
		( select ) => {
			const { getBlocks } = select( 'core/block-editor' );
			return {
				innerBlocks: getBlocks( clientId ),
			};
		},
		[ clientId ]
	);
	const { editEntityRecord } = useDispatch( 'core' );
	const blockChanges = useRef( 0 );
	useEffect( () => {
		if ( blockChanges.current < 4 ) blockChanges.current++;

		if (
			blockChanges.current === 3 &&
			( initialPostId.current === undefined ||
				initialPostId.current === null ) &&
			postId !== undefined &&
			postId !== null
		) {
			setAttributes( { postId } );
			editEntityRecord( 'postType', 'wp_template_part', postId, {
				status: 'publish',
			} );
		}
	}, [ innerBlocks ] );

	const BlockWrapper = Block[ tagName ];

	if ( postId ) {
		// Part of a template file, post ID already resolved.
		return (
			<BlockWrapper>
				<BlockControls>
					<TemplatePartNamePanel
						postId={ postId }
						setAttributes={ setAttributes }
					/>
				</BlockControls>
				<TemplatePartInnerBlocks
					postId={ postId }
					hasInnerBlocks={ innerBlocks.length > 0 }
				/>
			</BlockWrapper>
		);
	}
	if ( ! initialSlug.current && ! initialTheme.current ) {
		// Fresh new block.
		return (
			<BlockWrapper>
				<TemplatePartPlaceholder setAttributes={ setAttributes } />
			</BlockWrapper>
		);
	}
	// Part of a template file, post ID not resolved yet.
	return null;
}

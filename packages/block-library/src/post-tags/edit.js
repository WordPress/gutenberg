/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useEntityProp, store as coreStore } from '@wordpress/core-data';
import {
	BlockControls,
	Warning,
	useBlockProps,
	AlignmentToolbar,
} from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

export default function PostTagsEdit( { context, attributes, setAttributes } ) {
	const { textAlign } = attributes;

	const [ tags ] = useEntityProp(
		'postType',
		context.postType,
		'tags',
		context.postId
	);
	const tagLinks = useSelect(
		( select ) => {
			const { getEntityRecord } = select( coreStore );
			let loaded = true;

			const links = tags?.map( ( tagId ) => {
				const tag = getEntityRecord( 'taxonomy', 'post_tag', tagId );
				if ( ! tag ) {
					return ( loaded = false );
				}
				return (
					<a key={ tagId } href={ tag.link }>
						{ tag.name }
					</a>
				);
			} );

			return loaded && links;
		},
		[ tags ]
	);

	let display =
		tagLinks &&
		( tagLinks.length === 0
			? __( 'No tags.' )
			: tagLinks.reduce( ( prev, curr ) => [ prev, ' | ', curr ] ) );

	if ( ! context.postType || ! context.postId ) {
		display = (
			<Warning>
				{ __( 'Post tags block: No post found for this block.' ) }
			</Warning>
		);
	} else if ( context.postType !== 'post' ) {
		/**
		 * Do not render the block when viewing a page (as opposed to a post)
		 *
		 * @todo By default, only posts can be grouped by tags. Therefore, without any configuration,
		 * the post tags block will have no tags for pages. Plugins, however, can modify this behavior.
		 * In the future, instead of only evaluating posts, we should check whether the
		 * post_tag taxonomy is registered for the current post type.
		 */
		display = (
			<Warning>
				{ __(
					'Post tags block: Tags are not available for this post type.'
				) }
			</Warning>
		);
	}

	const blockProps = useBlockProps( {
		className: classnames( {
			[ `has-text-align-${ textAlign }` ]: textAlign,
		} ),
	} );

	return (
		<>
			<BlockControls>
				<AlignmentToolbar
					value={ textAlign }
					onChange={ ( nextAlign ) => {
						setAttributes( { textAlign: nextAlign } );
					} }
				/>
			</BlockControls>
			<div { ...blockProps }>{ display }</div>
		</>
	);
}

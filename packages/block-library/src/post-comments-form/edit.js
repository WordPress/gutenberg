/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	AlignmentControl,
	BlockControls,
	Warning,
	useBlockProps,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { Button } from '@wordpress/components';
import { useEntityProp, store as coreStore } from '@wordpress/core-data';
import { __, _x, sprintf } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import CommentsForm from './form';

export default function PostCommentsFormEdit( {
	attributes,
	context,
	setAttributes,
} ) {
	const { textAlign } = attributes;
	const { postId, postType } = context;
	const [ commentStatus, setCommentStatus ] = useEntityProp(
		'postType',
		postType,
		'comment_status',
		postId
	);
	const blockProps = useBlockProps( {
		className: classnames( {
			[ `has-text-align-${ textAlign }` ]: textAlign,
		} ),
	} );

	const isSiteEditor = postType === undefined || postId === undefined;

	const { defaultCommentStatus } = useSelect(
		( select ) =>
			select( blockEditorStore ).getSettings()
				.__experimentalDiscussionSettings
	);

	const postTypeSupportsComments = useSelect( ( select ) =>
		postType
			? !! select( coreStore ).getPostType( postType )?.supports.comments
			: false
	);

	let warning = false;
	let actions;
	let showPlaceholder = true;

	if ( ! isSiteEditor && 'open' !== commentStatus ) {
		if ( 'closed' === commentStatus ) {
			warning = sprintf(
				/* translators: 1: Post type (i.e. "post", "page") */
				__(
					'Post Comments Form block: Comments on this %s are not allowed.'
				),
				postType
			);
			actions = [
				<Button
					key="enableComments"
					onClick={ () => setCommentStatus( 'open' ) }
					variant="primary"
				>
					{ _x(
						'Enable comments',
						'action that affects the current post'
					) }
				</Button>,
			];
			showPlaceholder = false;
		} else if ( ! postTypeSupportsComments ) {
			warning = sprintf(
				/* translators: 1: Post type (i.e. "post", "page") */
				__(
					'Post Comments Form block: Comments for this post type (%s) are not enabled.'
				),
				postType
			);
			showPlaceholder = false;
		} else if ( 'open' !== defaultCommentStatus ) {
			warning = __(
				'Post Comments Form block: Comments are not enabled.'
			);
			showPlaceholder = false;
		}
	}

	return (
		<>
			<BlockControls group="block">
				<AlignmentControl
					value={ textAlign }
					onChange={ ( nextAlign ) => {
						setAttributes( { textAlign: nextAlign } );
					} }
				/>
			</BlockControls>
			<div { ...blockProps }>
				{ warning && (
					<Warning actions={ actions }>{ warning }</Warning>
				) }

				{ showPlaceholder ? <CommentsForm /> : null }
			</div>
		</>
	);
}

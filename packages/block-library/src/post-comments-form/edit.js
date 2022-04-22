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
} from '@wordpress/block-editor';
import { useEntityProp } from '@wordpress/core-data';
import { __, sprintf } from '@wordpress/i18n';
import {
	__experimentalUseDisabled as useDisabled,
	useInstanceId,
} from '@wordpress/compose';

export default function PostCommentsFormEdit( {
	attributes,
	context,
	setAttributes,
} ) {
	const { textAlign } = attributes;
	const { postId, postType } = context;
	const [ commentStatus ] = useEntityProp(
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

	const isInSiteEditor = postType === undefined || postId === undefined;

	const disabledFormRef = useDisabled();

	const instanceId = useInstanceId( PostCommentsFormEdit );

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
				{ ! commentStatus && ! isInSiteEditor && (
					<Warning>
						{ __(
							'Post Comments Form block: comments are not enabled for this post type.'
						) }
					</Warning>
				) }

				{ 'open' !== commentStatus && ! isInSiteEditor && (
					<Warning>
						{ sprintf(
							/* translators: 1: Post type (i.e. "post", "page") */
							__(
								'Post Comments Form block: comments to this %s are not allowed.'
							),
							postType
						) }
					</Warning>
				) }

				{ ( 'open' === commentStatus || isInSiteEditor ) && (
					<div>
						<h3>{ __( 'Leave a Reply' ) }</h3>
						<form
							noValidate
							className="comment-form"
							ref={ disabledFormRef }
						>
							<p>
								<label htmlFor={ `comment-${ instanceId }` }>
									{ __( 'Comment' ) }
								</label>
								<textarea
									id={ `comment-${ instanceId }` }
									name="comment"
									cols="45"
									rows="8"
								/>
							</p>
							<p>
								<input
									name="submit"
									className="submit wp-block-button__link"
									label={ __( 'Post Comment' ) }
									value={ __( 'Post Comment' ) }
									readOnly
								/>
							</p>
						</form>
					</div>
				) }
			</div>
		</>
	);
}

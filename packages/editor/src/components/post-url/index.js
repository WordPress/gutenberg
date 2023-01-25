/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { safeDecodeURIComponent, cleanForSlug } from '@wordpress/url';
import { useState } from '@wordpress/element';
import { __experimentalInspectorPopoverHeader as InspectorPopoverHeader } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import { TextControl, ExternalLink } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';

export default function PostURL( { onClose } ) {
	const {
		isEditable,
		postSlug,
		viewPostLabel,
		postLink,
		permalinkPrefix,
		permalinkSuffix,
	} = useSelect( ( select ) => {
		const post = select( editorStore ).getCurrentPost();
		const postTypeSlug = select( editorStore ).getCurrentPostType();
		const postType = select( coreStore ).getPostType( postTypeSlug );
		const permalinkParts = select( editorStore ).getPermalinkParts();
		const hasPublishAction = post?._links?.[ 'wp:action-publish' ] ?? false;

		return {
			isEditable:
				select( editorStore ).isPermalinkEditable() && hasPublishAction,
			postSlug: safeDecodeURIComponent(
				select( editorStore ).getEditedPostSlug()
			),
			viewPostLabel: postType?.labels.view_item,
			postLink: post.link,
			permalinkPrefix: permalinkParts?.prefix,
			permalinkSuffix: permalinkParts?.suffix,
		};
	}, [] );

	const { editPost } = useDispatch( editorStore );

	const [ forceEmptyField, setForceEmptyField ] = useState( false );

	return (
		<div className="editor-post-url">
			<InspectorPopoverHeader title={ __( 'URL' ) } onClose={ onClose } />
			{ isEditable && (
				<TextControl
					__nextHasNoMarginBottom
					label={ __( 'Permalink' ) }
					value={ forceEmptyField ? '' : postSlug }
					autoComplete="off"
					spellCheck="false"
					help={
						<>
							{ __( 'The last part of the URL.' ) }{ ' ' }
							<ExternalLink
								href={ __(
									'https://wordpress.org/support/article/settings-sidebar/#permalink'
								) }
							>
								{ __( 'Learn more.' ) }
							</ExternalLink>
						</>
					}
					onChange={ ( newValue ) => {
						editPost( { slug: newValue } );
						// When we delete the field the permalink gets
						// reverted to the original value.
						// The forceEmptyField logic allows the user to have
						// the field temporarily empty while typing.
						if ( ! newValue ) {
							if ( ! forceEmptyField ) {
								setForceEmptyField( true );
							}
							return;
						}
						if ( forceEmptyField ) {
							setForceEmptyField( false );
						}
					} }
					onBlur={ ( event ) => {
						editPost( {
							slug: cleanForSlug( event.target.value ),
						} );
						if ( forceEmptyField ) {
							setForceEmptyField( false );
						}
					} }
				/>
			) }
			{ isEditable && (
				<h3 className="editor-post-url__link-label">
					{ viewPostLabel ?? __( 'View post' ) }
				</h3>
			) }
			<p>
				<ExternalLink
					className="editor-post-url__link"
					href={ postLink }
					target="_blank"
				>
					{ isEditable ? (
						<>
							<span className="editor-post-url__link-prefix">
								{ permalinkPrefix }
							</span>
							<span className="editor-post-url__link-slug">
								{ postSlug }
							</span>
							<span className="editor-post-url__link-suffix">
								{ permalinkSuffix }
							</span>
						</>
					) : (
						postLink
					) }
				</ExternalLink>
			</p>
		</div>
	);
}

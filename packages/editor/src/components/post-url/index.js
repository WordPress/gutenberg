/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { safeDecodeURIComponent, cleanForSlug } from '@wordpress/url';
import { useState, createInterpolateElement } from '@wordpress/element';
import { __experimentalInspectorPopoverHeader as InspectorPopoverHeader } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import {
	ExternalLink,
	Button,
	__experimentalInputControl as InputControl,
	__experimentalInputControlPrefixWrapper as InputControlPrefixWrapper,
	__experimentalInputControlSuffixWrapper as InputControlSuffixWrapper,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { store as noticesStore } from '@wordpress/notices';
import { copySmall } from '@wordpress/icons';
import { store as coreStore } from '@wordpress/core-data';
import { useCopyToClipboard, useInstanceId } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';

/**
 * Renders the `PostURL` component.
 *
 * @example
 * ```jsx
 * <PostURL />
 * ```
 *
 * @param {{ onClose: () => void }} props         The props for the component.
 * @param {() => void}              props.onClose Callback function to be executed when the popover is closed.
 *
 * @return {React.ReactNode} The rendered PostURL component.
 */
export default function PostURL( { onClose } ) {
	const {
		isEditable,
		postSlug,
		postLink,
		permalinkPrefix,
		permalinkSuffix,
		permalink,
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
			permalink: safeDecodeURIComponent(
				select( editorStore ).getPermalink()
			),
		};
	}, [] );
	const { editPost } = useDispatch( editorStore );
	const { createNotice } = useDispatch( noticesStore );
	const [ forceEmptyField, setForceEmptyField ] = useState( false );
	const copyButtonRef = useCopyToClipboard( permalink, () => {
		createNotice( 'info', __( 'Copied Permalink to clipboard.' ), {
			isDismissible: true,
			type: 'snackbar',
		} );
	} );
	const postUrlSlugDescriptionId =
		'editor-post-url__slug-description-' + useInstanceId( PostURL );

	return (
		<div className="editor-post-url">
			<InspectorPopoverHeader
				title={ __( 'Slug' ) }
				onClose={ onClose }
			/>
			<VStack spacing={ 3 }>
				{ isEditable && (
					<p className="editor-post-url__intro">
						{ createInterpolateElement(
							__(
								'<span>Customize the last part of the Permalink.</span> <a>Learn more.</a>'
							),
							{
								span: <span id={ postUrlSlugDescriptionId } />,
								a: (
									<ExternalLink
										href={ __(
											'https://wordpress.org/documentation/article/page-post-settings-sidebar/#permalink'
										) }
									/>
								),
							}
						) }
					</p>
				) }
				<div>
					{ isEditable && (
						<>
							<InputControl
								__next40pxDefaultSize
								prefix={
									<InputControlPrefixWrapper>
										/
									</InputControlPrefixWrapper>
								}
								suffix={
									<InputControlSuffixWrapper variant="control">
										<Button
											icon={ copySmall }
											ref={ copyButtonRef }
											size="small"
											label="Copy"
										/>
									</InputControlSuffixWrapper>
								}
								label={ __( 'Slug' ) }
								hideLabelFromVision
								value={ forceEmptyField ? '' : postSlug }
								autoComplete="off"
								spellCheck="false"
								type="text"
								className="editor-post-url__input"
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
										slug: cleanForSlug(
											event.target.value
										),
									} );
									if ( forceEmptyField ) {
										setForceEmptyField( false );
									}
								} }
								aria-describedby={ postUrlSlugDescriptionId }
							/>
							<p className="editor-post-url__permalink">
								<span className="editor-post-url__permalink-visual-label">
									{ __( 'Permalink:' ) }
								</span>
								<ExternalLink
									className="editor-post-url__link"
									href={ postLink }
									target="_blank"
								>
									<span className="editor-post-url__link-prefix">
										{ permalinkPrefix }
									</span>
									<span className="editor-post-url__link-slug">
										{ postSlug }
									</span>
									<span className="editor-post-url__link-suffix">
										{ permalinkSuffix }
									</span>
								</ExternalLink>
							</p>
						</>
					) }
					{ ! isEditable && (
						<ExternalLink
							className="editor-post-url__link"
							href={ postLink }
							target="_blank"
						>
							{ postLink }
						</ExternalLink>
					) }
				</div>
			</VStack>
		</div>
	);
}

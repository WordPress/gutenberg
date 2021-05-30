/**
 * External dependencies
 */
import { get } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { PanelBody, TextControl, ExternalLink } from '@wordpress/components';
import { withSelect, withDispatch } from '@wordpress/data';
import { compose, ifCondition, withState } from '@wordpress/compose';
import { cleanForSlug, store as editorStore } from '@wordpress/editor';
import { safeDecodeURIComponent } from '@wordpress/url';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { store as editPostStore } from '../../../store';

/**
 * Module Constants
 */
const PANEL_NAME = 'post-link';

function PostLink( {
	isOpened,
	onTogglePanel,
	isEditable,
	postLink,
	permalinkPrefix,
	permalinkSuffix,
	editPermalink,
	forceEmptyField,
	setState,
	postSlug,
	postTypeLabel,
} ) {
	let prefixElement, postNameElement, suffixElement;
	if ( isEditable ) {
		prefixElement = permalinkPrefix && (
			<span className="edit-post-post-link__link-prefix">
				{ permalinkPrefix }
			</span>
		);
		postNameElement = postSlug && (
			<span className="edit-post-post-link__link-post-name">
				{ postSlug }
			</span>
		);
		suffixElement = permalinkSuffix && (
			<span className="edit-post-post-link__link-suffix">
				{ permalinkSuffix }
			</span>
		);
	}

	return (
		<PanelBody
			title={ __( 'Permalink' ) }
			opened={ isOpened }
			onToggle={ onTogglePanel }
		>
			{ isEditable && (
				<div className="editor-post-link">
					<TextControl
						label={ __( 'URL Slug' ) }
						value={ forceEmptyField ? '' : postSlug }
						onChange={ ( newValue ) => {
							editPermalink( newValue );
							// When we delete the field the permalink gets
							// reverted to the original value.
							// The forceEmptyField logic allows the user to have
							// the field temporarily empty while typing.
							if ( ! newValue ) {
								if ( ! forceEmptyField ) {
									setState( {
										forceEmptyField: true,
									} );
								}
								return;
							}
							if ( forceEmptyField ) {
								setState( {
									forceEmptyField: false,
								} );
							}
						} }
						onBlur={ ( event ) => {
							editPermalink( cleanForSlug( event.target.value ) );
							if ( forceEmptyField ) {
								setState( {
									forceEmptyField: false,
								} );
							}
						} }
					/>
					<p>
						{ __( 'The last part of the URL.' ) }{ ' ' }
						<ExternalLink href="https://wordpress.org/support/article/writing-posts/#post-field-descriptions">
							{ __( 'Read about permalinks' ) }
						</ExternalLink>
					</p>
				</div>
			) }
			<h3 className="edit-post-post-link__preview-label">
				{ postTypeLabel || __( 'View post' ) }
			</h3>
			<div className="edit-post-post-link__preview-link-container">
				<ExternalLink
					className="edit-post-post-link__link"
					href={ postLink }
					target="_blank"
				>
					{ isEditable ? (
						<>
							{ prefixElement }
							{ postNameElement }
							{ suffixElement }
						</>
					) : (
						postLink
					) }
				</ExternalLink>
			</div>
		</PanelBody>
	);
}

export default compose( [
	withSelect( ( select ) => {
		const {
			isPermalinkEditable,
			getCurrentPost,
			isCurrentPostPublished,
			getPermalinkParts,
			getEditedPostAttribute,
			getEditedPostSlug,
		} = select( editorStore );
		const { isEditorPanelEnabled, isEditorPanelOpened } = select(
			editPostStore
		);
		const { getPostType } = select( coreStore );

		const { link } = getCurrentPost();

		const postTypeName = getEditedPostAttribute( 'type' );
		const postType = getPostType( postTypeName );
		const permalinkParts = getPermalinkParts();

		return {
			postLink: link,
			isEditable: isPermalinkEditable(),
			isPublished: isCurrentPostPublished(),
			isOpened: isEditorPanelOpened( PANEL_NAME ),
			isEnabled: isEditorPanelEnabled( PANEL_NAME ),
			isViewable: get( postType, [ 'viewable' ], false ),
			postSlug: safeDecodeURIComponent( getEditedPostSlug() ),
			postTypeLabel: get( postType, [ 'labels', 'view_item' ] ),
			hasPermalinkParts: !! permalinkParts,
			permalinkPrefix: permalinkParts?.prefix,
			permalinkSuffix: permalinkParts?.suffix,
		};
	} ),
	ifCondition( ( { isEnabled, postLink, isViewable, hasPermalinkParts } ) => {
		return isEnabled && postLink && isViewable && hasPermalinkParts;
	} ),
	withDispatch( ( dispatch ) => {
		const { toggleEditorPanelOpened } = dispatch( editPostStore );
		const { editPost } = dispatch( editorStore );
		return {
			onTogglePanel: () => toggleEditorPanelOpened( PANEL_NAME ),
			editPermalink: ( newSlug ) => {
				editPost( { slug: newSlug } );
			},
		};
	} ),
	withState( {
		forceEmptyField: false,
	} ),
] )( PostLink );

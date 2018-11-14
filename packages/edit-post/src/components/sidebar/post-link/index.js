/**
 * External dependencies
 */
import { get } from 'lodash';

/**
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { PanelBody, TextControl } from '@wordpress/components';
import { withSelect, withDispatch } from '@wordpress/data';
import { compose, ifCondition, withState } from '@wordpress/compose';
import { addQueryArgs } from '@wordpress/url';

/**
 * Module Constants
 */
const PANEL_NAME = 'post-link';

function PostLink( {
	isOpened,
	onTogglePanel,
	isEditable,
	postLink,
	permalinkParts,
	editPermalink,
	postType,
	forceEmptyField,
	setState,
} ) {
	const { prefix, postName, suffix } = permalinkParts;
	let prefixElement, postNameElement, suffixElement;
	if ( isEditable ) {
		prefixElement = prefix && (
			<span className="edit-post-post-link__link-prefix">{ prefix }</span>
		);
		postNameElement = postName && (
			<span className="edit-post-post-link__link-post-name">{ postName }</span>
		);
		suffixElement = suffix && (
			<span className="edit-post-post-link__link-suffix">{ suffix }</span>
		);
	}

	const singularLabel = get( postType, [ 'labels', 'singular_name' ] );
	return (
		<PanelBody
			title={
				// translators: %s: post type singular name label e.g: Post, Page etc...
				sprintf( __( '%s Link' ), singularLabel )
			}
			opened={ isOpened }
			onToggle={ onTogglePanel }
		>
			{ isEditable && (
				<TextControl
					label={
						// translators: %s: post type singular name label e.g: Post, Page etc...
						sprintf( __( '%s URL' ), singularLabel )
					}
					value={ forceEmptyField ? '' : postName }
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
				/>
			) }
			<p className="edit-post-post-link__preview-label">
				{ __( 'Preview' ) }
			</p>
			<a
				className="edit-post-post-link__link"
				href={ postLink }
				target="_blank"
			>
				{ isEditable ?
					( <Fragment>
						{ prefixElement }{ postNameElement }{ suffixElement }
					</Fragment> ) :
					postLink
				}
			</a>
			<a
				className="edit-post-post-link__permalink-settings"
				href={ addQueryArgs( 'options-permalink.php' ) }
				target="_blank"
			>
				{ __( 'Permalink Settings' ) }
			</a>
		</PanelBody>
	);
}

export default compose( [
	withSelect( ( select ) => {
		const {
			isEditedPostNew,
			isPermalinkEditable,
			getCurrentPost,
			isCurrentPostPublished,
			getPermalinkParts,
			getEditedPostAttribute,
		} = select( 'core/editor' );
		const {
			isEditorPanelOpened,
		} = select( 'core/edit-post' );
		const {
			getPostType,
		} = select( 'core' );

		const { link } = getCurrentPost();
		const postTypeName = getEditedPostAttribute( 'type' );
		return {
			isNew: isEditedPostNew(),
			postLink: link,
			isEditable: isPermalinkEditable(),
			isPublished: isCurrentPostPublished(),
			isOpened: isEditorPanelOpened( PANEL_NAME ),
			permalinkParts: getPermalinkParts(),
			postType: getPostType( postTypeName ),
		};
	} ),
	ifCondition( ( { isNew, postLink, postType } ) => {
		return ! isNew && postLink && postType;
	} ),
	withDispatch( ( dispatch ) => {
		const { toggleEditorPanelOpened } = dispatch( 'core/edit-post' );
		const { editPost } = dispatch( 'core/editor' );
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

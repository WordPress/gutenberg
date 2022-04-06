/**
 * External dependencies
 */
import { get } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { Button, VisuallyHidden } from '@wordpress/components';
import { __, _x } from '@wordpress/i18n';
import { withSelect, withDispatch } from '@wordpress/data';
import { ifCondition, compose } from '@wordpress/compose';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';

export class PostPreviewButton extends Component {
	constructor() {
		super( ...arguments );

		this.openPreviewWindow = this.openPreviewWindow.bind( this );
	}

	getWindowTarget() {
		const { postId } = this.props;
		return `wp-preview-${ postId }`;
	}

	openPreviewWindow( event ) {
		// Our Preview button has its 'href' and 'target' set correctly for a11y
		// purposes. Unfortunately, though, we can't rely on the default 'click'
		// handler since sometimes it incorrectly opens a new tab instead of reusing
		// the existing one.
		// https://github.com/WordPress/gutenberg/pull/8330
		event.preventDefault();
		this.props.triggerExternalPreview( {
			targetId: this.getWindowTarget(),
			forceAutosave: this.props.forceIsAutosaveable,
			forcePreviewLink: this.props.forcePreviewLink,
		} );
	}

	render() {
		const { previewLink, currentPostLink, isSaveable, role } = this.props;

		// Link to the `?preview=true` URL if we have it, since this lets us see
		// changes that were autosaved since the post was last published. Otherwise,
		// just link to the post's URL.
		const href = previewLink || currentPostLink;

		const classNames = classnames(
			{
				'editor-post-preview': ! this.props.className,
			},
			this.props.className
		);

		return (
			<Button
				variant={ ! this.props.className ? 'tertiary' : undefined }
				className={ classNames }
				href={ href }
				target={ this.getWindowTarget() }
				disabled={ ! isSaveable }
				onClick={ this.openPreviewWindow }
				role={ role }
			>
				{ this.props.textContent ? (
					this.props.textContent
				) : (
					<>
						{ _x( 'Preview', 'imperative verb' ) }
						<VisuallyHidden as="span">
							{
								/* translators: accessibility text */
								__( '(opens in a new tab)' )
							}
						</VisuallyHidden>
					</>
				) }
			</Button>
		);
	}
}

export default compose( [
	withSelect( ( select, { forcePreviewLink } ) => {
		const {
			getCurrentPostId,
			getCurrentPostAttribute,
			getEditedPostAttribute,
			isEditedPostSaveable,
			getEditedPostPreviewLink,
		} = select( editorStore );
		const { getPostType } = select( coreStore );

		const previewLink = getEditedPostPreviewLink();
		const postType = getPostType( getEditedPostAttribute( 'type' ) );

		return {
			postId: getCurrentPostId(),
			currentPostLink: getCurrentPostAttribute( 'link' ),
			previewLink:
				forcePreviewLink !== undefined ? forcePreviewLink : previewLink,
			isSaveable: isEditedPostSaveable(),
			isViewable: get( postType, [ 'viewable' ], false ),
		};
	} ),
	withDispatch( ( dispatch ) => ( {
		triggerExternalPreview: dispatch( editorStore )
			.__unstableTriggerExternalPreview,
	} ) ),
	ifCondition( ( { isViewable } ) => isViewable ),
] )( PostPreviewButton );

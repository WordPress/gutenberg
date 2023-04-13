/**
 * WordPress dependencies
 */
import { withDispatch, withSelect } from '@wordpress/data';
import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { compose } from '@wordpress/compose';
import { safeDecodeURIComponent, cleanForSlug } from '@wordpress/url';
import { TextControl } from '@wordpress/components';

/**
 * Internal dependencies
 */
import PostSlugCheck from './check';
import { store as editorStore } from '../../store';

export class PostSlug extends Component {
	constructor( { postSlug, postTitle, postID } ) {
		super( ...arguments );

		this.state = {
			editedSlug:
				safeDecodeURIComponent( postSlug ) ||
				cleanForSlug( postTitle ) ||
				postID,
		};

		this.setSlug = this.setSlug.bind( this );
	}

	setSlug( event ) {
		const { postSlug, onUpdateSlug } = this.props;
		const { value } = event.target;

		const editedSlug = cleanForSlug( value );

		if ( editedSlug === postSlug ) {
			return;
		}

		onUpdateSlug( editedSlug );
	}

	render() {
		const { editedSlug } = this.state;
		return (
			<PostSlugCheck>
				<TextControl
					__nextHasNoMarginBottom
					label={ __( 'Slug' ) }
					autoComplete="off"
					spellCheck="false"
					value={ editedSlug }
					onChange={ ( slug ) =>
						this.setState( { editedSlug: slug } )
					}
					onBlur={ this.setSlug }
					className="editor-post-slug"
				/>
			</PostSlugCheck>
		);
	}
}

export default compose( [
	withSelect( ( select ) => {
		const { getCurrentPost, getEditedPostAttribute } =
			select( editorStore );

		const { id } = getCurrentPost();
		return {
			postSlug: getEditedPostAttribute( 'slug' ),
			postTitle: getEditedPostAttribute( 'title' ),
			postID: id,
		};
	} ),
	withDispatch( ( dispatch ) => {
		const { editPost } = dispatch( editorStore );
		return {
			onUpdateSlug( slug ) {
				editPost( { slug } );
			},
		};
	} ),
] )( PostSlug );

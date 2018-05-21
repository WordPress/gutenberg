/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { withInstanceId } from '@wordpress/components';
import { Component, compose } from '@wordpress/element';
import { withSelect, withDispatch } from '@wordpress/data';
import { authorAutocompleter } from '../../../editor/components/autocompleters';
import RichText from '../../../editor/components/rich-text';

/**
 * Internal dependencies
 */
import PostAuthorCheck from './check';

export class PostAuthor extends Component {
	constructor() {
		super( ...arguments );
		this.setAuthorId = this.setAuthorId.bind( this );
		this.state = {
			theAuthor: false,
		};
		const { postAuthor } = this.props;
		wp.apiRequest( { path: '/wp/v2/users/' + postAuthor + '?context=edit' } )
			.then( ( response ) => {
				this.setState( { theAuthor: response } );
			} );
	}

	// When an author is selected, set the post author.
	setAuthorId( value ) {
		if ( ! value ) {
			return;
		}
		const { onUpdateAuthor } = this.props;
		onUpdateAuthor( Number( value.id ) );
	}

	render() {
		const { instanceId } = this.props;
		const selectId = 'post-author-selector-' + instanceId;
		const theAuthor = this.state.theAuthor;

		// Disable reason: A select with an onchange throws a warning
		/* eslint-disable jsx-a11y/no-onchange */
		return (
			<PostAuthorCheck>
				<label htmlFor={ selectId }>{ __( 'Author' ) }</label>
				<RichText
					tagName="p"
					className="editor-post-author__select wp-block-paragraph"
					value={ theAuthor ? theAuthor.name : '' }
					aria-autocomplete="list"
					onChange={ this.setAuthorId }
					autocompleters={ [ authorAutocompleter ] }
				/>

			</PostAuthorCheck>
		);
		/* eslint-enable jsx-a11y/no-onchange */
	}
}

export default compose( [
	withSelect( ( select ) => {
		return {
			postAuthor: select( 'core/editor' ).getEditedPostAttribute( 'author' ),
			authors: select( 'core' ).getAuthors(),
		};
	} ),
	withDispatch( ( dispatch ) => ( {
		onUpdateAuthor( author ) {
			dispatch( 'core/editor' ).editPost( { author } );
		},
	} ) ),
	withInstanceId,
] )( PostAuthor );

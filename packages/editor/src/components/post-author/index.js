/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { withInstanceId, compose } from '@wordpress/compose';
import { Component } from '@wordpress/element';
import { withSelect, withDispatch } from '@wordpress/data';
import { decodeEntities } from '@wordpress/html-entities';
/**
 * Internal dependencies
 */
import PostAuthorCheck from './check';
import EnhancedPostAuthor from './enhanced-post-author';

export class PostAuthor extends Component {
	constructor() {
		super( ...arguments );

		this.setAuthorId = this.setAuthorId.bind( this );
	}

	setAuthorId( event ) {
		const { onUpdateAuthor } = this.props;
		const { value } = event.target;
		onUpdateAuthor( Number( value ) );
	}

	render() {
		const {
			postAuthor,
			postAuthorID,
			instanceId,
			authors,
			onUpdateAuthor,
		} = this.props;
		const selectId = 'post-author-selector-' + instanceId;

		// Wait until we have the post author before displaying the component.
		if ( ! postAuthor || 0 === postAuthor.length ) {
			return null;
		}

		// Disable reason: A select with an onchange throws a warning

		/* eslint-disable jsx-a11y/no-onchange */
		return (
			<PostAuthorCheck>
				<label htmlFor={ selectId }>{ __( 'Author' ) }</label>
				{ authors.length > 50 ? (
					<EnhancedPostAuthor
						id={ selectId }
						postAuthor={ postAuthor }
						authors={ authors }
						instanceId={ instanceId }
						onUpdateAuthor={ onUpdateAuthor }
					/>
				) : (
					<select
						id={ selectId }
						value={ postAuthorID }
						onChange={ this.setAuthorId }
						className="editor-post-author__select"
					>
						{ authors.map( ( author ) => (
							<option key={ author.id } value={ author.id }>
								{ decodeEntities( author.name ) }
							</option>
						) ) }
					</select>
				) }
			</PostAuthorCheck>
		);
		/* eslint-enable jsx-a11y/no-onchange */
	}
}

export default compose( [
	withSelect( ( select ) => {
		return {
			postAuthorID: select( 'core/editor' ).getEditedPostAttribute(
				'author'
			),
			postAuthor: select( 'core' ).getAuthor(
				select( 'core/editor' ).getEditedPostAttribute( 'author' )
			),
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

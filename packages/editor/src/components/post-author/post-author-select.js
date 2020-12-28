/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { compose } from '@wordpress/compose';
import { Component } from '@wordpress/element';
import { withSelect, withDispatch } from '@wordpress/data';
import { decodeEntities } from '@wordpress/html-entities';
import { SelectControl } from '@wordpress/components';

export class PostAuthorSelect extends Component {
	constructor() {
		super( ...arguments );

		this.setAuthorId = this.setAuthorId.bind( this );
	}

	setAuthorId( value ) {
		const { onUpdateAuthor } = this.props;
		onUpdateAuthor( Number( value ) );
	}

	render() {
		const { postAuthor, authors } = this.props;
		const authorOptions = authors.map( ( author ) => ( {
			label: decodeEntities( author.name ),
			value: author.id,
		} ) );

		return (
			<SelectControl
				className="post-author-selector"
				label={ __( 'Author' ) }
				options={ authorOptions }
				onChange={ this.setAuthorId }
				value={ postAuthor }
			/>
		);
	}
}

export default compose( [
	withSelect( ( select ) => {
		return {
			postAuthor: select( 'core/editor' ).getEditedPostAttribute(
				'author'
			),
			authors: select( 'core' ).getAuthors(),
		};
	} ),
	withDispatch( ( dispatch ) => ( {
		onUpdateAuthor( author ) {
			dispatch( 'core/editor' ).editPost( { author } );
		},
	} ) ),
] )( PostAuthorSelect );

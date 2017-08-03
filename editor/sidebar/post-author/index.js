/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { PanelRow, withInstanceId } from '@wordpress/components';
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import './style.scss';
import { getEditedPostAttribute } from '../../selectors';
import { editPost } from '../../actions';

class PostAuthor extends Component {
	constructor() {
		super( ...arguments );
		this.state = {
			authors: [],
		};
	}

	fetchAuthors() {
		this.fetchAuthorsRequest = new wp.api.collections.Users().fetch( { data: {
			per_page: 100,
		} } );
		this.fetchAuthorsRequest.then( ( authors ) => {
			this.setState( { authors } );
		} );
	}

	componentDidMount() {
		this.fetchAuthors();
	}

	componentWillUnmount() {
		this.fetchAuthorsRequest.abort();
	}

	render() {
		const { onUpdateAuthor, postAuthor, instanceId } = this.props;
		const { authors } = this.state;
		const selectId = 'post-author-selector-' + instanceId;

		if ( authors.length < 2 ) {
			return null;
		}

		// Disable reason: A select with an onchange throws a warning

		/* eslint-disable jsx-a11y/no-onchange */
		return (
			<PanelRow>
				<label htmlFor={ selectId }>{ __( 'Author' ) }</label>
				<select
					id={ selectId }
					value={ postAuthor }
					onChange={ ( event ) => onUpdateAuthor( event.target.value ) }
					className="editor-post-author__select"
				>
					{ authors.map( ( author ) => (
						<option key={ author.id } value={ author.id }>{ author.name }</option>
					) ) }
				</select>
			</PanelRow>
		);
		/* eslint-enable jsx-a11y/no-onchange */
	}
}

export default connect(
	( state ) => {
		return {
			postAuthor: getEditedPostAttribute( state, 'author' ),
		};
	},
	{
		onUpdateAuthor( author ) {
			return editPost( { author } );
		},
	},
)( withInstanceId( PostAuthor ) );

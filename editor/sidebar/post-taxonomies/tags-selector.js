/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { unescape, find } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from 'i18n';
import { Component } from 'element';
import { FormTokenField } from 'components';

/**
 * Internal dependencies
 */
import { getEditedPostAttribute } from '../../selectors';
import { editPost } from '../../actions';

const DEFAULT_TAGS_QUERY = {
	per_page: -1,
	orderby: 'count',
	order: 'DESC',
};
const MAX_TERMS_SUGGESTIONS = 20;

class TagsSelector extends Component {
	constructor() {
		super( ...arguments );
		this.onTagsChange = this.onTagsChange.bind( this );
		this.state = {
			loading: true,
			availableTags: [],
			selectedTags: [],
		};
	}

	componentDidMount() {
		this.fetchTagsRequest = new wp.api.collections.Tags().fetch( DEFAULT_TAGS_QUERY )
			.done( ( tags ) => {
				this.setState( {
					loading: false,
					availableTags: tags,
				} );
				this.updateSelectedTags( this.props.tags );
			} )
			.fail( ( xhr ) => {
				if ( xhr.statusText === 'abort' ) {
					return;
				}
				this.setState( {
					loading: false,
				} );
			} );
	}

	componentWillUnmount() {
		if ( this.fetchTagsRequest ) {
			this.fetchTagsRequest.abort();
		}
	}

	componentWillReceiveProps( newProps ) {
		if ( newProps.tags !== this.props.tags ) {
			this.updateSelectedTags( newProps.tags );
		}
	}

	updateSelectedTags( tags = [] ) {
		const selectedTags = tags.map( ( tagId ) => {
			const tagObject = find( this.state.availableTags, ( tag ) => tag.id === tagId );
			return tagObject ? tagObject.name : '';
		} );
		this.setState( {
			selectedTags,
		} );
	}

	onTagsChange( tagNames ) {
		this.setState( { selectedTags: tagNames } );
		const newTagNames = tagNames.filter( ( tagName ) =>
			! find( this.state.availableTags, ( tag ) => tag.name === tagName )
		);
		const tagNamesToIds = ( names, availableTags ) => {
			return names
				.map( ( tagName ) =>
					find( availableTags, ( tag ) => tag.name === tagName ).id
				);
		};

		if ( newTagNames.length === 0 ) {
			return this.props.onUpdateTags( tagNamesToIds( tagNames, this.state.availableTags ) );
		}
		const createTag = ( tagName ) => new wp.api.models.Tag( { name: tagName } ).save();
		Promise
			.all( newTagNames.map( createTag ) )
			.then( ( newTags ) => {
				const newAvailableTags = this.state.availableTags.concat( newTags );
				this.setState( { availableTags: newAvailableTags } );
				return this.props.onUpdateTags( tagNamesToIds( tagNames, newAvailableTags ) );
			} );
	}

	render() {
		const { loading, availableTags, selectedTags } = this.state;
		const tagNames = availableTags.map( ( tag ) => tag.name );

		return (
			<div className="editor-post-taxonomies__tags-selector">
				<h4 className="editor-post-taxonomies__tags-selector-title">{ __( 'Tags' ) }</h4>
				<FormTokenField
					value={ selectedTags }
					displayTransform={ unescape }
					suggestions={ tagNames }
					onChange={ this.onTagsChange }
					maxSuggestions={ MAX_TERMS_SUGGESTIONS }
					disabled={ loading }
					placeholder={ __( 'Add New Tag' ) }
					messages={ {
						added: __( 'Tag added.' ),
						removed: __( 'Tag removed.' ),
						remove: __( 'Remove tag: %s.' ),
					} }
				/>
			</div>
		);
	}
}

export default connect(
	( state ) => {
		return {
			tags: getEditedPostAttribute( state, 'tags' ),
		};
	},
	( dispatch ) => {
		return {
			onUpdateTags( tags ) {
				dispatch( editPost( { tags } ) );
			},
		};
	}
)( TagsSelector );


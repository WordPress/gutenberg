/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { unescape, find } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component } from 'element';
import { Spinner, FormTokenField } from 'components';
import { getEditedPostAttribute } from '../../selectors';
import { editPost } from '../../actions';

const DEFAULT_TAGS_QUERY = {
	number: 1000,
	order_by: 'count',
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
		};
	}

	componentDidMount() {
		this.fetchTagsRequest = new wp.api.collections.Tags().fetch( DEFAULT_TAGS_QUERY )
			.done( ( tags ) => {
				this.setState( {
					loading: false,
					availableTags: tags,
				} );
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

	onTagsChange( tagNames ) {
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
		const { tags = [] } = this.props;
		const { loading, availableTags } = this.state;
		const selectedTags = tags.map( ( tagId ) => {
			const tagObject = find( this.state.availableTags, ( tag ) => tag.id === tagId );
			return tagObject ? tagObject.name : '';
		} );
		const tagNames = availableTags.map( ( tag ) => tag.name );

		return (
			<div className="editor-post-taxonomies__tags-selector">
				{ loading && <Spinner /> }
				{ ! loading &&
					<FormTokenField
						value={ selectedTags }
						displayTransform={ unescape }
						suggestions={ tagNames }
						onChange={ this.onTagsChange }
						maxSuggestions={ MAX_TERMS_SUGGESTIONS }
					/>
				}
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


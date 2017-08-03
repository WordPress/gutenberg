/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { unescape, find, throttle } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import { FormTokenField } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getEditedPostAttribute } from '../../selectors';
import { editPost } from '../../actions';

const DEFAULT_TAGS_QUERY = {
	per_page: 100,
	orderby: 'count',
	order: 'desc',
};
const MAX_TERMS_SUGGESTIONS = 20;

class TagsSelector extends Component {
	constructor() {
		super( ...arguments );
		this.onTagsChange = this.onTagsChange.bind( this );
		this.searchTags = throttle( this.searchTags.bind( this ), 500 );
		this.findOrCreateTag = this.findOrCreateTag.bind( this );
		this.state = {
			loading: false,
			availableTags: [],
			selectedTags: [],
		};
	}

	componentDidMount() {
		if ( this.props.tags ) {
			this.setState( { loading: false } );
			this.initRequest = this.fetchTags( { include: this.props.tags } );
			this.initRequest.then(
				() => {
					this.setState( { loading: false } );
				},
				( xhr ) => {
					if ( xhr.statusText === 'abort' ) {
						return;
					}
					this.setState( {
						loading: false,
					} );
				}
			);
		}
		this.searchTags();
	}

	componentWillUnmount() {
		if ( this.initRequest ) {
			this.initRequest.abort();
		}
		if ( this.searchRequest ) {
			this.searchRequest.abort();
		}
	}

	componentWillReceiveProps( newProps ) {
		if ( newProps.tags !== this.props.tags ) {
			this.updateSelectedTags( newProps.tags );
		}
	}

	fetchTags( params = {} ) {
		const query = { ...DEFAULT_TAGS_QUERY, ...params };
		const request = new wp.api.collections.Tags().fetch( { data: query } );
		request.then( ( tags ) => {
			this.setState( ( state ) => ( {
				availableTags: state.availableTags.concat(
					tags.filter( ( tag ) => ! find( state.availableTags, ( availableTag ) => availableTag.id === tag.id ) )
				),
			} ) );
			this.updateSelectedTags( this.props.tags );
		} );

		return request;
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

	findOrCreateTag( tagName ) {
		return new Promise( ( resolve, reject ) => {
			// Tries to create a tag or fetch it if it already exists
			new wp.api.models.Tag( { name: tagName } ).save()
				.then( resolve, ( xhr ) => {
					const errorCode = xhr.responseJSON && xhr.responseJSON.code;
					if ( errorCode === 'term_exists' ) {
						return new wp.api.models.Tag( { id: xhr.responseJSON.data } )
							.fetch().then( resolve, reject );
					}
					reject( xhr );
				} );
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
		Promise
			.all( newTagNames.map( this.findOrCreateTag ) )
			.then( ( newTags ) => {
				const newAvailableTags = this.state.availableTags.concat( newTags );
				this.setState( { availableTags: newAvailableTags } );
				return this.props.onUpdateTags( tagNamesToIds( tagNames, newAvailableTags ) );
			} );
	}

	searchTags( search = '' ) {
		if ( this.searchRequest ) {
			this.searchRequest.abort();
		}
		this.searchRequest = this.fetchTags( { search } );
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
					onInputChange={ this.searchTags }
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


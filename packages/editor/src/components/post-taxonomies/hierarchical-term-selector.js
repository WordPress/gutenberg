/**
 * External dependencies
 */
import {
	get,
	unescape as unescapeString,
	without,
	find,
	some,
	invoke,
} from 'lodash';

/**
 * WordPress dependencies
 */
import { __, _x, _n, sprintf } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import {
	CheckboxControl,
	TreeSelect,
	withSpokenMessages,
	withFilters,
	Button,
} from '@wordpress/components';
import { withSelect, withDispatch } from '@wordpress/data';
import { withInstanceId, compose } from '@wordpress/compose';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { buildTermsTree } from '../../utils/terms';

/**
 * Module Constants
 */
const DEFAULT_QUERY = {
	per_page: -1,
	orderby: 'name',
	order: 'asc',
	_fields: 'id,name,parent',
};

const MIN_TERMS_COUNT_FOR_FILTER = 8;

class HierarchicalTermSelector extends Component {
	constructor() {
		super( ...arguments );
		this.findTerm = this.findTerm.bind( this );
		this.onChange = this.onChange.bind( this );
		this.onChangeFormName = this.onChangeFormName.bind( this );
		this.onChangeFormParent = this.onChangeFormParent.bind( this );
		this.onAddTerm = this.onAddTerm.bind( this );
		this.onToggleForm = this.onToggleForm.bind( this );
		this.setFilterValue = this.setFilterValue.bind( this );
		this.sortBySelected = this.sortBySelected.bind( this );
		this.state = {
			loading: true,
			availableTermsTree: [],
			availableTerms: [],
			adding: false,
			formName: '',
			formParent: '',
			showForm: false,
			filterValue: '',
			filteredTermsTree: [],
		};
	}

	onChange( termId ) {
		const { onUpdateTerms, terms = [], taxonomy } = this.props;
		const hasTerm = terms.indexOf( termId ) !== -1;
		const newTerms = hasTerm
			? without( terms, termId )
			: [ ...terms, termId ];
		onUpdateTerms( newTerms, taxonomy.rest_base );
	}

	onChangeFormName( event ) {
		const newValue =
			event.target.value.trim() === '' ? '' : event.target.value;
		this.setState( { formName: newValue } );
	}

	onChangeFormParent( newParent ) {
		this.setState( { formParent: newParent } );
	}

	onToggleForm() {
		this.setState( ( state ) => ( {
			showForm: ! state.showForm,
		} ) );
	}

	findTerm( terms, parent, name ) {
		return find( terms, ( term ) => {
			return (
				( ( ! term.parent && ! parent ) ||
					parseInt( term.parent ) === parseInt( parent ) ) &&
				term.name.toLowerCase() === name.toLowerCase()
			);
		} );
	}

	onAddTerm( event ) {
		event.preventDefault();
		const { onUpdateTerms, taxonomy, terms, slug } = this.props;
		const { formName, formParent, adding, availableTerms } = this.state;
		if ( formName === '' || adding ) {
			return;
		}

		// check if the term we are adding already exists
		const existingTerm = this.findTerm(
			availableTerms,
			formParent,
			formName
		);
		if ( existingTerm ) {
			// if the term we are adding exists but is not selected select it
			if ( ! some( terms, ( term ) => term === existingTerm.id ) ) {
				onUpdateTerms(
					[ ...terms, existingTerm.id ],
					taxonomy.rest_base
				);
			}
			this.setState( {
				formName: '',
				formParent: '',
			} );
			return;
		}

		this.setState( {
			adding: true,
		} );
		this.addRequest = apiFetch( {
			path: `/wp/v2/${ taxonomy.rest_base }`,
			method: 'POST',
			data: {
				name: formName,
				parent: formParent ? formParent : undefined,
			},
		} );
		// Tries to create a term or fetch it if it already exists
		const findOrCreatePromise = this.addRequest.catch( ( error ) => {
			const errorCode = error.code;
			if ( errorCode === 'term_exists' ) {
				// search the new category created since last fetch
				this.addRequest = apiFetch( {
					path: addQueryArgs( `/wp/v2/${ taxonomy.rest_base }`, {
						...DEFAULT_QUERY,
						parent: formParent || 0,
						search: formName,
					} ),
				} );
				return this.addRequest.then( ( searchResult ) => {
					return this.findTerm( searchResult, formParent, formName );
				} );
			}
			return Promise.reject( error );
		} );
		findOrCreatePromise.then(
			( term ) => {
				const hasTerm = !! find(
					this.state.availableTerms,
					( availableTerm ) => availableTerm.id === term.id
				);
				const newAvailableTerms = hasTerm
					? this.state.availableTerms
					: [ term, ...this.state.availableTerms ];
				const termAddedMessage = sprintf(
					/* translators: %s: taxonomy name */
					_x( '%s added', 'term' ),
					get(
						this.props.taxonomy,
						[ 'labels', 'singular_name' ],
						slug === 'category' ? __( 'Category' ) : __( 'Term' )
					)
				);
				this.props.speak( termAddedMessage, 'assertive' );
				this.addRequest = null;
				this.setState( {
					adding: false,
					formName: '',
					formParent: '',
					availableTerms: newAvailableTerms,
					availableTermsTree: this.sortBySelected(
						buildTermsTree( newAvailableTerms )
					),
				} );
				onUpdateTerms( [ ...terms, term.id ], taxonomy.rest_base );
			},
			( xhr ) => {
				if ( xhr.statusText === 'abort' ) {
					return;
				}
				this.addRequest = null;
				this.setState( {
					adding: false,
				} );
			}
		);
	}

	componentDidMount() {
		this.fetchTerms();
	}

	componentWillUnmount() {
		invoke( this.fetchRequest, [ 'abort' ] );
		invoke( this.addRequest, [ 'abort' ] );
	}

	componentDidUpdate( prevProps ) {
		if ( this.props.taxonomy !== prevProps.taxonomy ) {
			this.fetchTerms();
		}
	}

	fetchTerms() {
		const { taxonomy } = this.props;
		if ( ! taxonomy ) {
			return;
		}
		this.fetchRequest = apiFetch( {
			path: addQueryArgs(
				`/wp/v2/${ taxonomy.rest_base }`,
				DEFAULT_QUERY
			),
		} );
		this.fetchRequest.then(
			( terms ) => {
				// resolve
				const availableTermsTree = this.sortBySelected(
					buildTermsTree( terms )
				);

				this.fetchRequest = null;
				this.setState( {
					loading: false,
					availableTermsTree,
					availableTerms: terms,
				} );
			},
			( xhr ) => {
				// reject
				if ( xhr.statusText === 'abort' ) {
					return;
				}
				this.fetchRequest = null;
				this.setState( {
					loading: false,
				} );
			}
		);
	}

	sortBySelected( termsTree ) {
		const { terms } = this.props;
		const treeHasSelection = ( termTree ) => {
			if ( terms.indexOf( termTree.id ) !== -1 ) {
				return true;
			}
			if ( undefined === termTree.children ) {
				return false;
			}
			const anyChildIsSelected =
				termTree.children
					.map( treeHasSelection )
					.filter( ( child ) => child ).length > 0;
			if ( anyChildIsSelected ) {
				return true;
			}
			return false;
		};
		const termOrChildIsSelected = ( termA, termB ) => {
			const termASelected = treeHasSelection( termA );
			const termBSelected = treeHasSelection( termB );

			if ( termASelected === termBSelected ) {
				return 0;
			}

			if ( termASelected && ! termBSelected ) {
				return -1;
			}

			if ( ! termASelected && termBSelected ) {
				return 1;
			}

			return 0;
		};
		termsTree.sort( termOrChildIsSelected );
		return termsTree;
	}

	setFilterValue( event ) {
		const { availableTermsTree } = this.state;
		const filterValue = event.target.value;
		const filteredTermsTree = availableTermsTree
			.map( this.getFilterMatcher( filterValue ) )
			.filter( ( term ) => term );
		const getResultCount = ( terms ) => {
			let count = 0;
			for ( let i = 0; i < terms.length; i++ ) {
				count++;
				if ( undefined !== terms[ i ].children ) {
					count += getResultCount( terms[ i ].children );
				}
			}
			return count;
		};
		this.setState( {
			filterValue,
			filteredTermsTree,
		} );

		const resultCount = getResultCount( filteredTermsTree );
		const resultsFoundMessage = sprintf(
			/* translators: %d: number of results */
			_n( '%d result found.', '%d results found.', resultCount ),
			resultCount
		);
		this.props.debouncedSpeak( resultsFoundMessage, 'assertive' );
	}

	getFilterMatcher( filterValue ) {
		const matchTermsForFilter = ( originalTerm ) => {
			if ( '' === filterValue ) {
				return originalTerm;
			}

			// Shallow clone, because we'll be filtering the term's children and
			// don't want to modify the original term.
			const term = { ...originalTerm };

			// Map and filter the children, recursive so we deal with grandchildren
			// and any deeper levels.
			if ( term.children.length > 0 ) {
				term.children = term.children
					.map( matchTermsForFilter )
					.filter( ( child ) => child );
			}

			// If the term's name contains the filterValue, or it has children
			// (i.e. some child matched at some point in the tree) then return it.
			if (
				-1 !==
					term.name
						.toLowerCase()
						.indexOf( filterValue.toLowerCase() ) ||
				term.children.length > 0
			) {
				return term;
			}

			// Otherwise, return false. After mapping, the list of terms will need
			// to have false values filtered out.
			return false;
		};
		return matchTermsForFilter;
	}

	renderTerms( renderedTerms ) {
		const { terms = [] } = this.props;
		return renderedTerms.map( ( term ) => {
			return (
				<div
					key={ term.id }
					className="editor-post-taxonomies__hierarchical-terms-choice"
				>
					<CheckboxControl
						checked={ terms.indexOf( term.id ) !== -1 }
						onChange={ () => {
							const termId = parseInt( term.id, 10 );
							this.onChange( termId );
						} }
						label={ unescapeString( term.name ) }
					/>
					{ !! term.children.length && (
						<div className="editor-post-taxonomies__hierarchical-terms-subchoices">
							{ this.renderTerms( term.children ) }
						</div>
					) }
				</div>
			);
		} );
	}

	render() {
		const {
			slug,
			taxonomy,
			instanceId,
			hasCreateAction,
			hasAssignAction,
		} = this.props;

		if ( ! hasAssignAction ) {
			return null;
		}

		const {
			availableTermsTree,
			availableTerms,
			filteredTermsTree,
			formName,
			formParent,
			loading,
			showForm,
			filterValue,
		} = this.state;
		const labelWithFallback = (
			labelProperty,
			fallbackIsCategory,
			fallbackIsNotCategory
		) =>
			get(
				taxonomy,
				[ 'labels', labelProperty ],
				slug === 'category' ? fallbackIsCategory : fallbackIsNotCategory
			);
		const newTermButtonLabel = labelWithFallback(
			'add_new_item',
			__( 'Add new category' ),
			__( 'Add new term' )
		);
		const newTermLabel = labelWithFallback(
			'new_item_name',
			__( 'Add new category' ),
			__( 'Add new term' )
		);
		const parentSelectLabel = labelWithFallback(
			'parent_item',
			__( 'Parent Category' ),
			__( 'Parent Term' )
		);
		const noParentOption = `— ${ parentSelectLabel } —`;
		const newTermSubmitLabel = newTermButtonLabel;
		const inputId = `editor-post-taxonomies__hierarchical-terms-input-${ instanceId }`;
		const filterInputId = `editor-post-taxonomies__hierarchical-terms-filter-${ instanceId }`;
		const filterLabel = get(
			this.props.taxonomy,
			[ 'labels', 'search_items' ],
			__( 'Search Terms' )
		);
		const groupLabel = get(
			this.props.taxonomy,
			[ 'name' ],
			__( 'Terms' )
		);
		const showFilter = availableTerms.length >= MIN_TERMS_COUNT_FOR_FILTER;

		return [
			showFilter && (
				<label key="filter-label" htmlFor={ filterInputId }>
					{ filterLabel }
				</label>
			),
			showFilter && (
				<input
					type="search"
					id={ filterInputId }
					value={ filterValue }
					onChange={ this.setFilterValue }
					className="editor-post-taxonomies__hierarchical-terms-filter"
					key="term-filter-input"
				/>
			),
			<div
				className="editor-post-taxonomies__hierarchical-terms-list"
				key="term-list"
				tabIndex="0"
				role="group"
				aria-label={ groupLabel }
			>
				{ this.renderTerms(
					'' !== filterValue ? filteredTermsTree : availableTermsTree
				) }
			</div>,
			! loading && hasCreateAction && (
				<Button
					key="term-add-button"
					onClick={ this.onToggleForm }
					className="editor-post-taxonomies__hierarchical-terms-add"
					aria-expanded={ showForm }
					variant="link"
				>
					{ newTermButtonLabel }
				</Button>
			),
			showForm && (
				<form onSubmit={ this.onAddTerm } key="hierarchical-terms-form">
					<label
						htmlFor={ inputId }
						className="editor-post-taxonomies__hierarchical-terms-label"
					>
						{ newTermLabel }
					</label>
					<input
						type="text"
						id={ inputId }
						className="editor-post-taxonomies__hierarchical-terms-input"
						value={ formName }
						onChange={ this.onChangeFormName }
						required
					/>
					{ !! availableTerms.length && (
						<TreeSelect
							label={ parentSelectLabel }
							noOptionLabel={ noParentOption }
							onChange={ this.onChangeFormParent }
							selectedId={ formParent }
							tree={ availableTermsTree }
						/>
					) }
					<Button
						variant="secondary"
						type="submit"
						className="editor-post-taxonomies__hierarchical-terms-submit"
					>
						{ newTermSubmitLabel }
					</Button>
				</form>
			),
		];
	}
}

export default compose( [
	withSelect( ( select, { slug } ) => {
		const { getCurrentPost } = select( 'core/editor' );
		const { getTaxonomy } = select( 'core' );
		const taxonomy = getTaxonomy( slug );
		return {
			hasCreateAction: taxonomy
				? get(
						getCurrentPost(),
						[ '_links', 'wp:action-create-' + taxonomy.rest_base ],
						false
				  )
				: false,
			hasAssignAction: taxonomy
				? get(
						getCurrentPost(),
						[ '_links', 'wp:action-assign-' + taxonomy.rest_base ],
						false
				  )
				: false,
			terms: taxonomy
				? select( 'core/editor' ).getEditedPostAttribute(
						taxonomy.rest_base
				  )
				: [],
			taxonomy,
		};
	} ),
	withDispatch( ( dispatch ) => ( {
		onUpdateTerms( terms, restBase ) {
			dispatch( 'core/editor' ).editPost( { [ restBase ]: terms } );
		},
	} ) ),
	withSpokenMessages,
	withInstanceId,
	withFilters( 'editor.PostTaxonomyType' ),
] )( HierarchicalTermSelector );

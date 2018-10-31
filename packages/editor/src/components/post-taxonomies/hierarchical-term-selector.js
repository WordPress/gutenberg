/**
 * External dependencies
 */
import { get, unescape as unescapeString, without, find, some } from 'lodash';

/**
 * WordPress dependencies
 */
import { __, _x, _n, sprintf } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import { TreeSelect, withSpokenMessages, withFilters, Button } from '@wordpress/components';
import { withSelect, withDispatch } from '@wordpress/data';
import { withInstanceId, compose } from '@wordpress/compose';

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
};

const MIN_TERMS_COUNT_FOR_FILTER = 8;
const EMPTY_AVAILABLE_TERMS = [];

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
		this.state = {
			formName: '',
			formParent: '',
			showForm: false,
			filterValue: '',
			filteredTermsTree: [],
		};
	}

	onChange( event ) {
		const { onUpdateTerms, terms = [] } = this.props;
		const termId = parseInt( event.target.value, 10 );
		const hasTerm = terms.indexOf( termId ) !== -1;
		const newTerms = hasTerm ?
			without( terms, termId ) :
			[ ...terms, termId ];
		onUpdateTerms( newTerms );
	}

	onChangeFormName( event ) {
		const newValue = event.target.value.trim() === '' ? '' : event.target.value;
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
			return ( ( ! term.parent && ! parent ) || parseInt( term.parent ) === parseInt( parent ) ) &&
				term.name.toLowerCase() === name.toLowerCase();
		} );
	}

	onAddTerm( event ) {
		event.preventDefault();
		const { onUpdateTerms, addTermToEditedPost, terms, availableTerms } = this.props;
		const { formName, formParent } = this.state;
		if ( formName === '' ) {
			return;
		}

		// check if the term we are adding already exists
		const existingTerm = this.findTerm( availableTerms, formParent, formName );
		if ( existingTerm ) {
			// if the term we are adding exists but is not selected select it
			if ( ! some( terms, ( term ) => term === existingTerm.id ) ) {
				onUpdateTerms( [ ...terms, existingTerm.id ] );
			}
			this.setState( {
				formName: '',
				formParent: '',
			} );
			return;
		}

		addTermToEditedPost( {
			name: formName,
			parent: formParent ? formParent : undefined,
		} );
		this.setState( {
			formName: '',
			formParent: '',
		} );
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
			const anyChildIsSelected = termTree.children.map( treeHasSelection ).filter( ( child ) => child ).length > 0;
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
		const { availableTermsTree } = this.props;
		const filterValue = event.target.value;
		const filteredTermsTree = availableTermsTree.map( this.getFilterMatcher( filterValue ) ).filter( ( term ) => term );
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
				term.children = term.children.map( matchTermsForFilter ).filter( ( child ) => child );
			}

			// If the term's name contains the filterValue, or it has children
			// (i.e. some child matched at some point in the tree) then return it.
			if ( -1 !== term.name.toLowerCase().indexOf( filterValue ) || term.children.length > 0 ) {
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
			const id = `editor-post-taxonomies-hierarchical-term-${ term.id }`;
			return (
				<div key={ term.id } className="editor-post-taxonomies__hierarchical-terms-choice">
					<input
						id={ id }
						className="editor-post-taxonomies__hierarchical-terms-input"
						type="checkbox"
						checked={ terms.indexOf( term.id ) !== -1 }
						value={ term.id }
						onChange={ this.onChange }
					/>
					<label htmlFor={ id }>{ unescapeString( term.name ) }</label>
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
			availableTermsTree,
			availableTerms,
		} = this.props;

		if ( ! hasAssignAction ) {
			return null;
		}

		const { filteredTermsTree, formName, formParent, isRequestingTerms, showForm, filterValue } = this.state;
		const labelWithFallback = ( labelProperty, fallbackIsCategory, fallbackIsNotCategory ) => get(
			taxonomy,
			[ 'data', 'labels', labelProperty ],
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
		const filterLabel = sprintf(
			_x( 'Search %s', 'term' ),
			get(
				this.props.taxonomy,
				[ 'name' ],
				slug === 'category' ? __( 'Categories' ) : __( 'Terms' )
			)
		);
		const groupLabel = sprintf(
			_x( 'Available %s', 'term' ),
			get(
				this.props.taxonomy,
				[ 'name' ],
				slug === 'category' ? __( 'Categories' ) : __( 'Terms' )
			)
		);
		const showFilter = availableTerms.length >= MIN_TERMS_COUNT_FOR_FILTER;

		return [
			showFilter && <label
				key="filter-label"
				htmlFor={ filterInputId }>
				{ filterLabel }
			</label>,
			showFilter && <input
				type="search"
				id={ filterInputId }
				value={ filterValue }
				onChange={ this.setFilterValue }
				className="editor-post-taxonomies__hierarchical-terms-filter"
				key="term-filter-input"
			/>,
			<div
				className="editor-post-taxonomies__hierarchical-terms-list"
				key="term-list"
				tabIndex="0"
				role="group"
				aria-label={ groupLabel }
			>
				{ this.renderTerms( '' !== filterValue ? filteredTermsTree : this.sortBySelected( availableTermsTree ) ) }
			</div>,
			! isRequestingTerms && hasCreateAction && (
				<Button
					key="term-add-button"
					onClick={ this.onToggleForm }
					className="editor-post-taxonomies__hierarchical-terms-add"
					aria-expanded={ showForm }
					isLink
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
					{ !! availableTerms.length &&
						<TreeSelect
							label={ parentSelectLabel }
							noOptionLabel={ noParentOption }
							onChange={ this.onChangeFormParent }
							selectedId={ formParent }
							tree={ availableTermsTree }
						/>
					}
					<Button
						isDefault
						type="submit"
						className="editor-post-taxonomies__hierarchical-terms-submit"
					>
						{ newTermSubmitLabel }
					</Button>
				</form>
			),
		];
		/* eslint-enable jsx-a11y/no-onchange */
	}
}

export default compose( [
	withSelect( ( select, { slug } ) => {
		const { getCurrentPost } = select( 'core/editor' );
		const { getTaxonomy, getEntityRecords } = select( 'core' );
		const { isResolving } = select( 'core/data' );
		const taxonomy = getTaxonomy( slug );
		const availableTerms = getEntityRecords( 'taxonomy', slug, DEFAULT_QUERY ) ||
			EMPTY_AVAILABLE_TERMS;
		const availableTermsTree = buildTermsTree( availableTerms );
		return {
			hasCreateAction: taxonomy ? get( getCurrentPost(), [ '_links', 'wp:action-create-' + taxonomy.rest_base ], false ) : false,
			hasAssignAction: taxonomy ? get( getCurrentPost(), [ '_links', 'wp:action-assign-' + taxonomy.rest_base ], false ) : false,
			terms: taxonomy ? select( 'core/editor' ).getEditedPostAttribute( taxonomy.rest_base ) : [],
			isRequestingTerms: isResolving( 'core', 'getEntityRecords', [ 'taxonomy', slug, DEFAULT_QUERY ] ),
			taxonomy,
			availableTerms,
			availableTermsTree,
		};
	} ),
	withDispatch( ( dispatch, { slug, taxonomy } ) => ( {
		onUpdateTerms( terms ) {
			dispatch( 'core/editor' ).editPost( { [ taxonomy.rest_base ]: terms } );
		},
		addTermToEditedPost( term ) {
			return dispatch( 'core/editor' ).addTermToEditedPost( slug, term );
		},
	} ) ),
	withSpokenMessages,
	withInstanceId,
	withFilters( 'editor.PostTaxonomyType' ),
] )( HierarchicalTermSelector );

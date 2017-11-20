/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { unescape as unescapeString, without, groupBy, map, repeat, find } from 'lodash';

/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import { withInstanceId } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getEditedPostAttribute } from '../../state/selectors';
import { editPost } from '../../state/actions';

const DEFAULT_QUERY = {
	per_page: 100,
	orderby: 'count',
	order: 'desc',
};

class HierarchicalTermSelector extends Component {
	constructor() {
		super( ...arguments );
		this.onChange = this.onChange.bind( this );
		this.onChangeFormName = this.onChangeFormName.bind( this );
		this.onChangeFormParent = this.onChangeFormParent.bind( this );
		this.onAddTerm = this.onAddTerm.bind( this );
		this.onToggleForm = this.onToggleForm.bind( this );
		this.state = {
			loading: true,
			availableTermsTree: [],
			availableTerms: [],
			adding: false,
			formName: '',
			formParent: '',
			showForm: false,
		};
	}

	buildTermsTree( flatTerms ) {
		const termsByParent = groupBy( flatTerms, 'parent' );
		const fillWithChildren = ( terms ) => {
			return terms.map( ( term ) => {
				const children = termsByParent[ term.id ];
				return {
					...term,
					children: children && children.length ?
						fillWithChildren( children ) :
						[],
				};
			} );
		};

		return fillWithChildren( termsByParent[ 0 ] || [] );
	}

	onChange( event ) {
		const { onUpdateTerms, terms = [], restBase } = this.props;
		const termId = parseInt( event.target.value, 10 );
		const hasTerm = terms.indexOf( termId ) !== -1;
		const newTerms = hasTerm ?
			without( terms, termId ) :
			[ ...terms, termId ];
		onUpdateTerms( newTerms, restBase );
	}

	onChangeFormName( event ) {
		const newValue = event.target.value.trim() === '' ? '' : event.target.value;
		this.setState( { formName: newValue } );
	}

	onChangeFormParent( event ) {
		this.setState( { formParent: event.target.value } );
	}

	onToggleForm() {
		this.setState( ( state ) => ( {
			showForm: ! state.showForm,
		} ) );
	}

	onAddTerm( event ) {
		event.preventDefault();
		const { formName, formParent } = this.state;
		if ( formName === '' ) {
			return;
		}
		const findOrCreatePromise = new Promise( ( resolve, reject ) => {
			this.setState( {
				adding: true,
			} );
			// Tries to create a term or fetch it if it already exists
			const Model = wp.api.getTaxonomyModel( this.props.slug );
			this.addRequest = new Model( {
				name: formName,
				parent: formParent ? formParent : undefined,
			} ).save();
			this.addRequest
				.then( resolve, ( xhr ) => {
					const errorCode = xhr.responseJSON && xhr.responseJSON.code;
					if ( errorCode === 'term_exists' ) {
						this.addRequest = new Model( { id: xhr.responseJSON.data } ).fetch();
						return this.addRequest.then( resolve, reject );
					}
					reject( xhr );
				} );
		} );
		findOrCreatePromise
			.then( ( term ) => {
				const hasTerm = !! find( this.state.availableTerms, ( availableTerm ) => availableTerm.id === term.id );
				const newAvailableTerms = hasTerm ? this.state.availableTerms : [ term, ...this.state.availableTerms ];
				const { onUpdateTerms, restBase, terms } = this.props;
				this.setState( {
					adding: false,
					formName: '',
					formParent: '',
					availableTerms: newAvailableTerms,
					availableTermsTree: this.buildTermsTree( newAvailableTerms ),
				} );
				onUpdateTerms( [ ...terms, term.id ], restBase );
			}, ( xhr ) => {
				if ( xhr.statusText === 'abort' ) {
					return;
				}
				this.setState( {
					adding: false,
				} );
			} );
	}

	componentDidMount() {
		const Collection = wp.api.getTaxonomyCollection( this.props.slug );
		this.fetchRequest = new Collection()
			.fetch( { data: DEFAULT_QUERY } )
			.done( ( terms ) => {
				const availableTermsTree = this.buildTermsTree( terms );

				this.setState( {
					loading: false,
					availableTermsTree,
					availableTerms: terms,
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
		if ( this.fetchRequest ) {
			this.fetchRequest.abort();
		}

		if ( this.addRequest ) {
			this.addRequest.abort();
		}
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

	renderParentSelectorOptions( terms, level = 0 ) {
		return map( terms, ( term ) => ( [
			<option key={ term.id } value={ term.id }>
				{ repeat( '\u00A0', level * 3 ) + unescapeString( term.name ) }
			</option>,
			...this.renderParentSelectorOptions( term.children, level + 1 ),
		] ) );
	}

	render() {
		const { availableTermsTree, availableTerms, formName, formParent, loading, adding, showForm } = this.state;
		const { label, slug, instanceId } = this.props;

		const newTermButtonLabel = slug === 'category' ? __( 'Add new category' ) : __( 'Add new term' );
		const newTermLabel = slug === 'category' ? __( 'Category Name' ) : __( 'Term Name' );
		const parentSelectLabel = slug === 'category' ? __( 'Parent Category' ) : __( 'Parent Term' );
		const noParentOption = slug === 'category' ? _x( 'None', 'category' ) : _x( 'None', 'term' );
		const newTermSubmitLabel = slug === 'category' ? __( 'Add Category' ) : __( 'Add Term' );
		const inputId = `editor-post-taxonomies__hierarchical-terms-input-${ instanceId }`;
		const selectId = `editor-post-taxonomies__hierarchical-terms-select-${ instanceId }`;

		/* eslint-disable jsx-a11y/no-onchange */
		return (
			<div className="editor-post-taxonomies__hierarchical-terms-selector">
				<h4 className="editor-post-taxonomies__hierarchical-terms-selector-title">{ label }</h4>
				{ this.renderTerms( availableTermsTree ) }
				{ ! loading &&
					<button
						onClick={ this.onToggleForm }
						className="button-link editor-post-taxonomies__hierarchical-terms-add"
						aria-expanded={ showForm }
					>
						{ newTermButtonLabel }
					</button>
				}
				{ showForm &&
					<form onSubmit={ this.onAddTerm }>
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
							<div>
								<label
									htmlFor={ selectId }
									className="editor-post-taxonomies__hierarchical-terms-label"
								>
									{ parentSelectLabel }
								</label>
								<select
									id={ selectId }
									className="editor-post-taxonomies__hierarchical-terms-input"
									value={ formParent }
									onChange={ this.onChangeFormParent }
								>
									<option value="">{ noParentOption }</option>
									{ this.renderParentSelectorOptions( availableTermsTree ) }
								</select>
							</div>
						}
						<button
							type="submit"
							className="button editor-post-taxonomies__hierarchical-terms-submit"
							disabled={ adding }
						>
							{ newTermSubmitLabel }
						</button>
					</form>
				}
			</div>
		);
		/* eslint-enable jsx-a11y/no-onchange */
	}
}

export default connect(
	( state, onwProps ) => {
		return {
			terms: getEditedPostAttribute( state, onwProps.restBase ),
		};
	},
	{
		onUpdateTerms( terms, restBase ) {
			return editPost( { [ restBase ]: terms } );
		},
	}
)( withInstanceId( HierarchicalTermSelector ) );

/**
 * External dependencies
 */
import { filter, includes, map, find, some, deburr, without } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { withSelect, withDispatch } from '@wordpress/data';
import { compose, withInstanceId } from '@wordpress/compose';
import { Component } from '@wordpress/element';
import { ToggleControl, PanelBody } from '@wordpress/components';
import { __experimentalBlockTypesList as BlockTypesList } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

/**
 * Filters an item list given a search term.
 *
 * @param {Object[]} items      Set of inserter items to search within.
 * @param {Object[]} categories Set of categories to search within.
 * @param {string}   searchTerm Search term.
 *
 * @return {Object[]} Filtered item list.
 */
export const searchItems = ( items, categories, searchTerm ) => {
	const normalizedSearchTerm = normalizeTerm( searchTerm );
	const matchSearch = ( string ) => normalizeTerm( string ).includes( normalizedSearchTerm );

	return items.filter( ( item ) => {
		const itemCategory = find( categories, { slug: item.category } );

		return (
			matchSearch( item.title ) ||
			some( item.keywords, matchSearch ) ||
			( itemCategory && matchSearch( itemCategory.title ) )
		);
	} );
};

/**
 * Converts the search term into a normalized term.
 *
 * @param {string} term The search term to normalize.
 *
 * @return {string} The normalized search term.
 */
export const normalizeTerm = ( term ) => {
	// Disregard diacritics.
	//  Input: "média"
	term = deburr( term );

	// Accommodate leading slash, matching autocomplete expectations.
	//  Input: "/media"
	term = term.replace( /^\//, '' );

	// Lowercase.
	//  Input: "MEDIA"
	term = term.toLowerCase();

	// Strip leading and trailing whitespace.
	//  Input: " media "
	term = term.trim();

	return term;
};

class BlockManager extends Component {
	constructor() {
		super( ...arguments );

		this.togglePanel = this.togglePanel.bind( this );
		this.setSearch = this.setSearch.bind( this );

		this.state = {
			search: '',
			openPanels: [],
		};
	}

	/**
	 * Given a category slug, toggles its results panel as opened or closed.
	 *
	 * @param {string} category Category slug
	 */
	togglePanel( category ) {
		let { openPanels } = this.state;

		openPanels = openPanels.includes( category ) ?
			without( openPanels.category ) :
			openPanels.concat( category );

		this.setState( { openPanels } );
	}

	/**
	 * Filters the results panel in response to an InputEvent.
	 *
	 * @param {SyntheticEvent} event Synthetic input event.
	 */
	setSearch( event ) {
		this.setState( { search: event.target.value } );
	}

	render() {
		const {
			instanceId,
			categories,
			blockTypes,
			hiddenBlockTypes,
			showBlockTypes,
			hideBlockTypes,
		} = this.props;
		const {
			search,
			openPanels,
		} = this.state;

		const blockItems = blockTypes.map( ( blockType ) => ( {
			id: blockType.name,
			icon: blockType.icon,
			title: blockType.title,
			category: blockType.category,
			hasChildBlocksWithInserterSupport: false,
			className: classnames( 'edit-post-manage-blocks-modal__block-type', {
				'is-hidden': includes( hiddenBlockTypes, blockType.name ),
			} ),
		} ) );

		const filteredBlockItems = search ?
			searchItems( blockItems, categories, search ) :
			blockItems;

		return (
			<div className="edit-post-manage-blocks-modal__content">
				<label
					htmlFor={ `edit-post-manage-blocks-modal__search-${ instanceId }` }
					className="screen-reader-text"
				>
					{ __( 'Search for a block' ) }
				</label>
				<input
					id={ `edit-post-manage-blocks-modal__search-${ instanceId }` }
					type="search"
					placeholder={ __( 'Search for a block' ) }
					className="edit-post-manage-blocks-modal__search"
					value={ search }
					onInput={ this.setSearch }
				/>
				<div className="edit-post-manage-blocks-modal__results">
					{ categories.map( ( category ) => {
						const categoryBlockItems = filter( filteredBlockItems, {
							category: category.slug,
						} );

						if ( ! categoryBlockItems.length ) {
							return null;
						}

						const isAllHidden = categoryBlockItems.every( ( blockItem ) => {
							return hiddenBlockTypes.includes( blockItem.id );
						} );

						const toggleAllHidden = ( isToBeDisabled ) => {
							const blockNames = map( categoryBlockItems, 'id' );
							if ( isToBeDisabled ) {
								hideBlockTypes( blockNames );
							} else {
								showBlockTypes( blockNames );
							}
						};

						return (
							<PanelBody
								key={ category.slug }
								title={ category.title }
								icon={ category.icon }
								opened={ !! search || openPanels.includes( category.slug ) }
								onToggle={ this.togglePanel.bind( this, category.slug ) }
							>
								<ToggleControl
									label={ __( 'Hide all blocks' ) }
									checked={ isAllHidden }
									onChange={ toggleAllHidden }
								/>
								<BlockTypesList
									items={ categoryBlockItems }
									onSelect={ ( item ) => (
										includes( hiddenBlockTypes, item.id ) ?
											showBlockTypes( item.id ) :
											hideBlockTypes( item.id )
									) }
								/>
							</PanelBody>
						);
					} ) }
				</div>
			</div>
		);
	}
}

export default compose( [
	withInstanceId,
	withSelect( ( select ) => {
		const { getBlockTypes, getCategories } = select( 'core/blocks' );
		const { getPreference } = select( 'core/edit-post' );

		return {
			blockTypes: getBlockTypes(),
			categories: getCategories(),
			hiddenBlockTypes: getPreference( 'hiddenBlockTypes' ),
		};
	} ),
	withDispatch( ( dispatch ) => {
		const {
			showBlockTypes,
			hideBlockTypes,
		} = dispatch( 'core/edit-post' );

		return {
			showBlockTypes,
			hideBlockTypes,
		};
	} ),
] )( BlockManager );

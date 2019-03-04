/**
 * External dependencies
 */
import { filter, includes, map, find, some, deburr } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { withSelect, withDispatch } from '@wordpress/data';
import { compose, withInstanceId, withState } from '@wordpress/compose';
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

function BlockManager( {
	instanceId,
	categories,
	blockTypes,
	disabledBlockTypes,
	enableBlockTypes,
	disableBlockTypes,
	search,
	setState,
} ) {
	const blockItems = blockTypes.map( ( blockType ) => ( {
		id: blockType.name,
		icon: blockType.icon,
		title: blockType.title,
		category: blockType.category,
		hasChildBlocksWithInserterSupport: false,
		className: classnames( 'edit-post-manage-blocks-modal__block-type', {
			'is-inactive': includes( disabledBlockTypes, blockType.name ),
		} ),
	} ) );

	const filteredBlockItems = search ?
		searchItems( blockItems, categories, search ) :
		blockItems;

	// Disable reason (no-autofocus): The block manager is a modal display, not
	// one which is always visible, and one which already incurs this behavior
	// of autoFocus via Popover's focusOnMount.

	/* eslint-disable jsx-a11y/no-autofocus */
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
				onInput={
					( event ) => setState( { search: event.target.value } )
				}
				autoFocus
			/>
			<div className="edit-post-manage-blocks-modal__results">
				{ categories.map( ( category ) => {
					const categoryBlockItems = filter( filteredBlockItems, {
						category: category.slug,
					} );

					if ( ! categoryBlockItems.length ) {
						return null;
					}

					const isAllDisabled = categoryBlockItems.every( ( blockItem ) => {
						return disabledBlockTypes.includes( blockItem.id );
					} );

					const toggleAllDisabled = ( isToBeDisabled ) => {
						const blockNames = map( categoryBlockItems, 'id' );
						if ( isToBeDisabled ) {
							disableBlockTypes( blockNames );
						} else {
							enableBlockTypes( blockNames );
						}
					};

					return (
						<PanelBody
							key={ category.slug }
							title={ category.title }
							icon={ category.icon }
						>
							<ToggleControl
								label={ __( 'Disable all' ) }
								checked={ isAllDisabled }
								onChange={ toggleAllDisabled }
							/>
							<BlockTypesList
								items={ categoryBlockItems }
								onSelect={ ( item ) => (
									includes( disabledBlockTypes, item.id ) ?
										enableBlockTypes( item.id ) :
										disableBlockTypes( item.id )
								) }
							/>
						</PanelBody>
					);
				} ) }
			</div>
		</div>
	);
	/* eslint-enable jsx-a11y/no-autofocus */
}

export default compose( [
	withInstanceId,
	withState( {
		search: '',
	} ),
	withSelect( ( select ) => {
		const { getBlockTypes, getCategories } = select( 'core/blocks' );
		const { getPreference } = select( 'core/edit-post' );

		return {
			blockTypes: getBlockTypes(),
			categories: getCategories(),
			disabledBlockTypes: getPreference( 'disabledBlockTypes' ),
		};
	} ),
	withDispatch( ( dispatch ) => {
		const {
			enableBlockTypes,
			disableBlockTypes,
		} = dispatch( 'core/edit-post' );

		return {
			enableBlockTypes,
			disableBlockTypes,
		};
	} ),
] )( BlockManager );

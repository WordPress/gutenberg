/**
 * External dependencies
 */
import { filter, without } from 'lodash';

/**
 * WordPress dependencies
 */
import { withSelect } from '@wordpress/data';
import { compose } from '@wordpress/compose';
import { Component } from '@wordpress/element';
import { TextControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import BlockManagerCategory from './category';

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
	 * Sets the search term by which to filter results.
	 *
	 * @param {string} search Search term.
	 */
	setSearch( search ) {
		this.setState( { search } );
	}

	render() {
		const {
			categories,
			blockTypes,
			hiddenBlockTypes,
			hasBlockSupport,
			isMatchingSearchTerm,
		} = this.props;
		const { search, openPanels } = this.state;

		const blockItems = blockTypes
			.filter( ( blockType ) => (
				hasBlockSupport( blockType, 'inserter', true ) &&
				( ! search || isMatchingSearchTerm( blockType, search ) )
			) )
			.map( ( blockType ) => ( {
				id: blockType.name,
				icon: blockType.icon,
				title: blockType.title,
				category: blockType.category,
			} ) );

		return (
			<div className="edit-post-manage-blocks-modal__content">
				<TextControl
					type="search"
					label={ __( 'Search for a block' ) }
					value={ search }
					onChange={ this.setSearch }
					className="edit-post-manage-blocks-modal__search"
				/>
				<div className="edit-post-manage-blocks-modal__results">
					{ categories.map( ( category ) => (
						<BlockManagerCategory
							key={ category.slug }
							category={ category }
							blockItems={ filter( blockItems, {
								category: category.slug,
							} ) }
							hiddenBlockTypes={ hiddenBlockTypes }
							opened={ (
								!! search ||
								openPanels.includes( category.slug )
							) }
							onToggle={ this.togglePanel.bind( this, category.slug ) }
						/>
					) ) }
				</div>
			</div>
		);
	}
}

export default compose( [
	withSelect( ( select ) => {
		const {
			getBlockTypes,
			getCategories,
			hasBlockSupport,
			isMatchingSearchTerm,
		} = select( 'core/blocks' );
		const { getPreference } = select( 'core/edit-post' );

		return {
			blockTypes: getBlockTypes(),
			categories: getCategories(),
			hiddenBlockTypes: getPreference( 'hiddenBlockTypes' ),
			hasBlockSupport,
			isMatchingSearchTerm,
		};
	} ),
] )( BlockManager );

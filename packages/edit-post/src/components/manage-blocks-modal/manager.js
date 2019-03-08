/**
 * External dependencies
 */
import { filter, includes, map, without } from 'lodash';

/**
 * WordPress dependencies
 */
import { withSelect, withDispatch } from '@wordpress/data';
import { compose, withState } from '@wordpress/compose';
import { Component, cloneElement, Children } from '@wordpress/element';
import { TextControl, ToggleControl, PanelBody } from '@wordpress/components';
import { __experimentalBlockTypesList as BlockTypesList } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

class BlockManager extends Component {
	constructor() {
		super( ...arguments );

		this.togglePanel = this.togglePanel.bind( this );
		this.setSearch = this.setSearch.bind( this );

		this.state = {
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
		this.props.setState( { search } );
	}

	render() {
		const {
			categories,
			blockTypes,
			hiddenBlockTypes,
			showBlockTypes,
			hideBlockTypes,
			search,
		} = this.props;
		const { openPanels } = this.state;

		const blockItems = blockTypes.map( ( blockType ) => ( {
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
					{ categories.map( ( category ) => {
						const categoryBlockItems = filter( blockItems, {
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
									renderItem={ ( { children, item } ) => {
										const isHidden = includes( hiddenBlockTypes, item.id );
										if ( ! isHidden ) {
											return children;
										}

										const child = Children.only( children );
										return cloneElement( child, {
											'data-hidden': __( 'Hidden' ),
										} );
									} }
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
	withState( { search: '' } ),
	withSelect( ( select, ownProps ) => {
		const {
			getBlockTypesBySearchTerm,
			getCategories,
		} = select( 'core/blocks' );
		const { getPreference } = select( 'core/edit-post' );
		const { search } = ownProps;

		return {
			blockTypes: getBlockTypesBySearchTerm( search ),
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

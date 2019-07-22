/**
 * WordPress dependencies
 */
import { compose } from '@wordpress/compose';
import { withDispatch } from '@wordpress/data';
import {
	Dropdown,
	IconButton,
	MenuItem,
	NavigableMenu,
	TextControl,
} from '@wordpress/components';
import { useState, useMemo, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { createBlock } from '@wordpress/blocks';
import { isURL } from '@wordpress/url';

function MenuItemInserter( { insertMenuItem } ) {
	const [ searchInput, setSearchInput ] = useState( '' );
	const isUrlInput = useMemo( () => isURL( searchInput ), [ searchInput ] );
	const onMenuItemClick = useCallback( () => {
		insertMenuItem( {
			destination: searchInput,
		} );
	}, [ insertMenuItem, searchInput ] );

	return (
		<Dropdown
			className="wp-block-navigation-menu__inserter"
			position="bottom center"
			renderToggle={ ( { isOpen, onToggle } ) => (
				<IconButton
					icon="insert"
					label={ __( 'Insert a new menu item' ) }
					onClick={ onToggle }
					aria-expanded={ isOpen }
				/>
			) }
			renderContent={ () => (
				<div className="wp-block-navigation-menu__inserter-content">
					<TextControl
						value={ searchInput }
						label={ __( 'Search or paste a link' ) }
						onChange={ setSearchInput }
					/>
					{ isUrlInput && (
						<NavigableMenu>
							<MenuItem
								onClick={ onMenuItemClick }
								icon="admin-links"
							>
								{ searchInput }
							</MenuItem>
						</NavigableMenu>
					) }
				</div>
			) }
		/>
	);
}

export default compose( [
	withDispatch( ( dispatch, props, { select } ) => {
		return {
			insertMenuItem( attributes ) {
				const {
					getBlockOrder,
				} = select( 'core/block-editor' );
				const {
					insertBlock,
				} = dispatch( 'core/block-editor' );
				const index = getBlockOrder( props.rootClientId ).length;
				const insertedBlock = createBlock(
					'core/navigation-menu-item',
					attributes
				);
				insertBlock(
					insertedBlock,
					index,
					props.rootClientId
				);
			},
		};
	} ),
] )( MenuItemInserter );

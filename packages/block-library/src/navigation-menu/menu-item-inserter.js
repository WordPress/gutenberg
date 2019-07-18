/**
 * WordPress dependencies
 */
import { compose } from '@wordpress/compose';
import { withDispatch } from '@wordpress/data';
import {
	IconButton,
	MenuItem,
	NavigableMenu,
} from '@wordpress/components';
import { useState, useMemo, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { isURL } from '@wordpress/url';
import { createBlock } from '@wordpress/blocks';
import { URLPopover, URLInput } from '@wordpress/block-editor';

function MenuItemInserter( { insertMenuItem } ) {
	const [ searchInput, setSearchInput ] = useState( '' );
	const [ isOpen, setIsOpen ] = useState( false );
	const openLinkUI = useCallback( () => {
		setIsOpen( ! isOpen );
	} );

	const isUrlInput = useMemo( () => isURL( searchInput ), [ searchInput ] );
	const onMenuItemClick = useCallback( () => {
		insertMenuItem( {
			destination: searchInput,
		} );
	}, [ insertMenuItem, searchInput ] );

	return (
		<div>
			<IconButton
				icon="insert"
				label={ __( 'Insert a new menu item' ) }
				onClick={ openLinkUI }
				aria-expanded={ isOpen }
			/>
			{ isOpen && (
				<URLPopover>
					<NavigableMenu>
						<MenuItem>
							<URLInput
								value={ searchInput }
								onChange={ setSearchInput }
								isFullWidth
							/>
						</MenuItem>
						{ isUrlInput && (
							<MenuItem
								onClick={ onMenuItemClick }
								icon="admin-links"
							>
								{ searchInput }
							</MenuItem>
						) }
					</NavigableMenu>
				</URLPopover>
			) }
		</div>
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

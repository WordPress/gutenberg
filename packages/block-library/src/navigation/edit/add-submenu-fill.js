/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';
import { addSubmenu } from '@wordpress/icons';
import { MenuItem } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	BlockSettingsMenuControls,
	store as blockEditorStore,
} from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { DEFAULT_BLOCK } from '../constants';
import { NavigationLinkUI } from './navigation-link-ui';

const BLOCKS_THAT_CAN_BE_CONVERTED_TO_SUBMENU = [
	'core/navigation-link',
	'core/navigation-submenu',
];

function AddSubmenuItem( {
	clientId,
	onClose,
	expand,
	expandedState,
	setInsertedBlock,
} ) {
	const { insertBlock, replaceBlock, replaceInnerBlocks } =
		useDispatch( blockEditorStore );

	const block = useSelect(
		( select ) => select( blockEditorStore ).getBlock( clientId ),
		[ clientId ]
	);

	return (
		<MenuItem
			icon={ addSubmenu }
			onClick={ () => {
				const updateSelectionOnInsert = false;
				const newLink = createBlock(
					DEFAULT_BLOCK.name,
					DEFAULT_BLOCK.attributes
				);

				let expandClientId = clientId;

				if ( block.name === 'core/navigation-submenu' ) {
					insertBlock(
						newLink,
						block.innerBlocks.length,
						clientId,
						updateSelectionOnInsert
					);
				} else {
					// Convert to a submenu if the block currently isn't one.
					const newSubmenu = createBlock(
						'core/navigation-submenu',
						block.attributes,
						block.innerBlocks
					);

					// The following must happen as two independent actions.
					// Why? Because the offcanvas editor relies on the getLastInsertedBlocksClientIds
					// selector to determine which block is "active". As the UX needs the newLink to be
					// the "active" block it must be the last block to be inserted.
					// Therefore the Submenu is first created and **then** the newLink is inserted
					// thus ensuring it is the last inserted block.
					replaceBlock( clientId, newSubmenu );

					replaceInnerBlocks(
						newSubmenu.clientId,
						[ newLink ],
						updateSelectionOnInsert
					);

					expandClientId = newSubmenu.clientId;
				}

				if ( setInsertedBlock ) {
					setInsertedBlock( newLink );
				}

				if (
					expandedState &&
					expand &&
					! expandedState[ expandClientId ]
				) {
					expand( expandClientId );
				}
				onClose();
			} }
		>
			{ __( 'Add submenu link' ) }
		</MenuItem>
	);
}

export default function AddSubmenuFill( { navigationBlockClientId } ) {
	const [ insertedBlock, setInsertedBlock ] = useState( null );
	const [ popoverAnchor, setPopoverAnchor ] = useState( null );

	useEffect( () => {
		if ( ! insertedBlock?.clientId ) {
			setPopoverAnchor( null );
			return;
		}
		// Wait for the list view to re-render with the new block
		// before querying for the DOM element.
		const rafId = window.requestAnimationFrame( () => {
			const listViewRow = document.querySelector(
				`.editor-list-view-sidebar [data-block="${ insertedBlock.clientId }"]`
			);
			setPopoverAnchor( listViewRow || null );
		} );
		return () => window.cancelAnimationFrame( rafId );
	}, [ insertedBlock?.clientId ] );

	return (
		<>
			<BlockSettingsMenuControls supportsContentOnly>
				{ ( fillProps ) => (
					<AddSubmenuFillContent
						navigationBlockClientId={ navigationBlockClientId }
						{ ...fillProps }
						setInsertedBlock={ setInsertedBlock }
					/>
				) }
			</BlockSettingsMenuControls>
			{ insertedBlock && popoverAnchor && (
				<NavigationLinkUI
					block={ insertedBlock }
					insertedBlock={ insertedBlock }
					setInsertedBlock={ setInsertedBlock }
					anchor={ popoverAnchor }
				/>
			) }
		</>
	);
}

function AddSubmenuFillContent( {
	navigationBlockClientId,
	selectedClientIds,
	selectedBlocks,
	onClose,
	expand,
	expandedState,
	setInsertedBlock,
} ) {
	const isChildOfThisNav = useSelect(
		( select ) => {
			if (
				! selectedClientIds?.length ||
				selectedClientIds.length !== 1
			) {
				return false;
			}
			const { getBlockParents } = select( blockEditorStore );
			return getBlockParents( selectedClientIds[ 0 ] ).includes(
				navigationBlockClientId
			);
		},
		[ selectedClientIds, navigationBlockClientId ]
	);

	if ( ! isChildOfThisNav ) {
		return null;
	}

	if (
		! BLOCKS_THAT_CAN_BE_CONVERTED_TO_SUBMENU.includes(
			selectedBlocks[ 0 ]
		)
	) {
		return null;
	}

	return (
		<AddSubmenuItem
			clientId={ selectedClientIds[ 0 ] }
			onClose={ onClose }
			expand={ expand }
			expandedState={ expandedState }
			setInsertedBlock={ setInsertedBlock }
		/>
	);
}

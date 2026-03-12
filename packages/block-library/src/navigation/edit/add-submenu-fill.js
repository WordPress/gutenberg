/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';
import { addSubmenu } from '@wordpress/icons';
import { MenuItem } from '@wordpress/components';
import { useDispatch, useSelect, select as dataSelect } from '@wordpress/data';
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';
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
	expand,
	expandedState,
	setInsertedBlock,
	toggleElement,
	onAddSubmenuLink,
	menuItemRef,
} ) {
	const { insertBlock, replaceBlock, replaceInnerBlocks } =
		useDispatch( blockEditorStore );

	const block = useSelect(
		( select ) => select( blockEditorStore ).getBlock( clientId ),
		[ clientId ]
	);

	return (
		<MenuItem
			ref={ menuItemRef }
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

				// When the block was converted to a submenu, the
				// original toggleElement is unmounted. Pass the new
				// block's clientId so the popover anchor can find the
				// replacement row's button.
				const wasConverted = expandClientId !== clientId;
				onAddSubmenuLink( {
					toggleElement: wasConverted ? null : toggleElement,
					clientId: expandClientId,
				} );
			} }
		>
			{ __( 'Add submenu link' ) }
		</MenuItem>
	);
}

/**
 * Queries the list view for an Options button at the given block
 * position. Used after cancel to focus the reverted block's button.
 *
 * @param {string} parentClientId The parent block's clientId.
 * @param {number} blockIndex     The block's index among siblings.
 * @return {HTMLElement|null} The Options button element, or null.
 */
function findOptionsButtonByIndex( parentClientId, blockIndex ) {
	const parentRow = document.querySelector(
		`[data-block="${ parentClientId }"]`
	);
	if ( ! parentRow ) {
		return null;
	}
	// Find sibling rows that are direct children of this parent
	// in the list view treegrid. Rows at the next nesting level
	// follow the parent row in DOM order.
	const treegrid = parentRow.closest( '[role="treegrid"]' );
	if ( ! treegrid ) {
		return null;
	}
	const allRows = treegrid.querySelectorAll( '[role="row"]' );
	let childCount = 0;
	const parentDepth = parseInt( parentRow.getAttribute( 'aria-level' ), 10 );
	let foundParent = false;
	for ( const row of allRows ) {
		if ( row === parentRow ) {
			foundParent = true;
			continue;
		}
		if ( ! foundParent ) {
			continue;
		}
		const level = parseInt( row.getAttribute( 'aria-level' ), 10 );
		if ( level <= parentDepth ) {
			break; // Past the parent's children.
		}
		if ( level === parentDepth + 1 ) {
			if ( childCount === blockIndex ) {
				return row.querySelector(
					'.block-editor-list-view-block__menu'
				);
			}
			childCount++;
		}
	}
	return null;
}

export default function AddSubmenuFill( { navigationBlockClientId } ) {
	const [ insertedBlock, setInsertedBlock ] = useState( null );
	const [ popoverAnchor, setPopoverAnchor ] = useState( null );
	const [ focusTarget, setFocusTarget ] = useState( null );
	const dropdownContextRef = useRef( null );
	const menuItemRef = useRef( null );

	// Called when the "Add submenu link" menu item is clicked.
	// Stores the anchor context and hides the dropdown content
	// (keeps it mounted). The actual anchor element is resolved
	// in the useEffect below, after React has flushed the DOM
	// updates from replaceBlock.
	const handleAddSubmenuLink = useCallback(
		( { toggleElement, clientId, onClose, setDropdownContentHidden } ) => {
			dropdownContextRef.current = {
				toggleElement,
				clientId,
				onClose,
				setDropdownContentHidden,
			};

			// Hide the dropdown popover but keep it mounted so the
			// "Add submenu link" menu item remains focusable on cancel.
			setDropdownContentHidden( true );
		},
		[]
	);

	// Focus the target element after React has flushed the render
	// that unmounts NavigationLinkUI. The useEffect runs after the
	// popover's useFocusReturn hook (which fires during commit).
	useEffect( () => {
		if ( focusTarget ) {
			const { element, blockPosition } = focusTarget;

			if ( element ) {
				element.focus();
			}

			if ( blockPosition ) {
				// In the conversion case, the submenu auto-reverts to
				// a navigation-link after removeBlock empties it. This
				// creates a new block with a new clientId, so the
				// original DOM element is replaced. Use setTimeout to
				// wait for the list view to re-render, then find the
				// replacement block's Options button by position.
				const { parentClientId, index } = blockPosition;
				window.setTimeout( () => {
					const button = findOptionsButtonByIndex(
						parentClientId,
						index
					);
					button?.focus();
				}, 300 );
			}

			setFocusTarget( null );
		}
	}, [ focusTarget ] );

	// Resolve the popover anchor after React has flushed DOM updates.
	// When the block was converted to a submenu, the new row only
	// exists in the DOM after the list view re-renders, so we must
	// wait until the useEffect fires (post-render) to query for it.
	useEffect( () => {
		if ( insertedBlock && dropdownContextRef.current && ! popoverAnchor ) {
			const { toggleElement, clientId } = dropdownContextRef.current;
			const anchor =
				toggleElement ??
				document.querySelector(
					`[data-block="${ clientId }"] .block-editor-list-view-block__menu`
				);
			setPopoverAnchor( anchor );
		}
	}, [ insertedBlock, popoverAnchor ] );

	// Called when the user selects a link in NavigationLinkUI.
	// Closes the dropdown entirely and returns focus to the
	// Options toggle button.
	const handleSubmit = useCallback( () => {
		setPopoverAnchor( null );
		const ctx = dropdownContextRef.current;
		if ( ctx ) {
			ctx.setDropdownContentHidden?.( false );
			ctx.onClose?.();
		}
		dropdownContextRef.current = null;
	}, [] );

	// Called when the user presses Escape in NavigationLinkUI.
	// If the block wasn't converted, shows the dropdown again and
	// focuses the "Add submenu link" menu item. If the block was
	// converted to a submenu, the original menu item no longer
	// exists so we close the dropdown and focus the new block's
	// Options button instead.
	const handleCancel = useCallback( () => {
		setPopoverAnchor( null );
		const ctx = dropdownContextRef.current;

		if ( menuItemRef.current ) {
			// Non-conversion case: dropdown menu item still exists.
			ctx?.setDropdownContentHidden?.( false );
			setFocusTarget( { element: menuItemRef.current } );
		} else if ( ctx?.clientId ) {
			// Conversion case: the submenu will auto-revert to a
			// navigation-link (with a new clientId) after
			// removeBlock empties it. Store the block's position
			// so we can find the replacement after re-render.
			const { getBlockRootClientId, getBlockIndex } =
				dataSelect( blockEditorStore );
			const parentClientId = getBlockRootClientId( ctx.clientId );
			const index = getBlockIndex( ctx.clientId );
			ctx?.setDropdownContentHidden?.( false );
			ctx?.onClose?.();
			setFocusTarget( {
				blockPosition: { parentClientId, index },
			} );
		}

		dropdownContextRef.current = null;
	}, [] );

	return (
		<>
			<BlockSettingsMenuControls supportsContentOnly>
				{ ( fillProps ) => (
					<AddSubmenuFillContent
						navigationBlockClientId={ navigationBlockClientId }
						{ ...fillProps }
						setInsertedBlock={ setInsertedBlock }
						onAddSubmenuLink={ handleAddSubmenuLink }
						menuItemRef={ menuItemRef }
					/>
				) }
			</BlockSettingsMenuControls>
			{ insertedBlock && popoverAnchor && (
				<NavigationLinkUI
					block={ insertedBlock }
					insertedBlock={ insertedBlock }
					setInsertedBlock={ setInsertedBlock }
					anchor={ popoverAnchor }
					onSubmit={ handleSubmit }
					onCancel={ handleCancel }
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
	toggleElement,
	setDropdownContentHidden,
	onAddSubmenuLink,
	menuItemRef,
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
			expand={ expand }
			expandedState={ expandedState }
			setInsertedBlock={ setInsertedBlock }
			toggleElement={ toggleElement }
			onAddSubmenuLink={ ( anchorContext ) => {
				onAddSubmenuLink( {
					...anchorContext,
					onClose,
					setDropdownContentHidden,
				} );
			} }
			menuItemRef={ menuItemRef }
		/>
	);
}

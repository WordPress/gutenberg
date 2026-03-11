/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';
import { addSubmenu } from '@wordpress/icons';
import { MenuItem } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
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

export default function AddSubmenuFill( { navigationBlockClientId } ) {
	const [ insertedBlock, setInsertedBlock ] = useState( null );
	const [ popoverAnchor, setPopoverAnchor ] = useState( null );
	const anchorContextRef = useRef( null );
	const dropdownOnCloseRef = useRef( null );
	const setDropdownContentHiddenRef = useRef( null );
	const menuItemRef = useRef( null );

	// Called when the "Add submenu link" menu item is clicked.
	// Stores the anchor context and hides the dropdown content
	// (keeps it mounted). The actual anchor element is resolved
	// in the useEffect below, after React has flushed the DOM
	// updates from replaceBlock.
	const handleAddSubmenuLink = useCallback(
		( { toggleElement, clientId, onClose, setDropdownContentHidden } ) => {
			anchorContextRef.current = { toggleElement, clientId };
			dropdownOnCloseRef.current = onClose;
			setDropdownContentHiddenRef.current = setDropdownContentHidden;

			// Hide the dropdown popover but keep it mounted so the
			// "Add submenu link" menu item remains focusable on cancel.
			setDropdownContentHidden( true );
		},
		[]
	);

	// Resolve the popover anchor after React has flushed DOM updates.
	// When the block was converted to a submenu, the new row only
	// exists in the DOM after the list view re-renders, so we must
	// wait until the useEffect fires (post-render) to query for it.
	useEffect( () => {
		if ( insertedBlock && anchorContextRef.current && ! popoverAnchor ) {
			const { toggleElement, clientId } = anchorContextRef.current;
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
		if ( setDropdownContentHiddenRef.current ) {
			setDropdownContentHiddenRef.current( false );
		}
		if ( dropdownOnCloseRef.current ) {
			dropdownOnCloseRef.current();
		}
		dropdownOnCloseRef.current = null;
		setDropdownContentHiddenRef.current = null;
	}, [] );

	// Called when the user presses Escape in NavigationLinkUI.
	// Shows the dropdown again and focuses the "Add submenu link"
	// menu item.
	const handleCancel = useCallback( () => {
		setPopoverAnchor( null );
		if ( setDropdownContentHiddenRef.current ) {
			setDropdownContentHiddenRef.current( false );
		}
		dropdownOnCloseRef.current = null;
		setDropdownContentHiddenRef.current = null;

		// Defer focus to let the dropdown re-render as visible first.
		window.setTimeout( () => {
			menuItemRef.current?.focus();
		}, 0 );
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

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
	onClose,
	expand,
	expandedState,
	setInsertedBlock,
	setReturnFocusClientId,
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

				// Track the parent block so focus can return to its
				// Options button when the link popover closes.
				if ( setReturnFocusClientId ) {
					setReturnFocusClientId( expandClientId );
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
	const returnFocusClientIdRef = useRef( null );

	const setReturnFocusClientId = useCallback( ( id ) => {
		returnFocusClientIdRef.current = id;
	}, [] );

	// When the link popover closes (insertedBlock becomes null),
	// return focus to the parent block's Options button. Deferred
	// to the next event loop tick so it runs after the Popover's
	// own focus-return logic and any list view focus shifts from
	// block removal.
	useEffect( () => {
		if ( ! insertedBlock && returnFocusClientIdRef.current ) {
			const clientId = returnFocusClientIdRef.current;
			returnFocusClientIdRef.current = null;

			const timerId = window.setTimeout( () => {
				const btn = document.querySelector(
					`.editor-list-view-sidebar [data-block="${ clientId }"] .block-editor-list-view-block__menu`
				);
				btn?.focus();
			}, 0 );

			return () => window.clearTimeout( timerId );
		}
	}, [ insertedBlock ] );

	useEffect( () => {
		if ( ! insertedBlock?.clientId ) {
			setPopoverAnchor( null );
			return;
		}

		const selector = `.editor-list-view-sidebar [data-block="${ insertedBlock.clientId }"] .block-editor-list-view-block__menu`;

		// Check if the element is already in the DOM.
		const existing = document.querySelector( selector );
		if ( existing ) {
			setPopoverAnchor( existing );
			return;
		}

		// Otherwise, observe the list view sidebar until the block
		// row is rendered.
		const sidebar = document.querySelector( '.editor-list-view-sidebar' );
		if ( ! sidebar ) {
			return;
		}

		const observer = new window.MutationObserver( () => {
			const element = document.querySelector( selector );
			if ( element ) {
				observer.disconnect();
				setPopoverAnchor( element );
			}
		} );

		observer.observe( sidebar, {
			childList: true,
			subtree: true,
		} );

		return () => observer.disconnect();
	}, [ insertedBlock?.clientId ] );

	return (
		<>
			<BlockSettingsMenuControls supportsContentOnly>
				{ ( fillProps ) => (
					<AddSubmenuFillContent
						navigationBlockClientId={ navigationBlockClientId }
						{ ...fillProps }
						setInsertedBlock={ setInsertedBlock }
						setReturnFocusClientId={ setReturnFocusClientId }
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
	setReturnFocusClientId,
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
			setReturnFocusClientId={ setReturnFocusClientId }
		/>
	);
}

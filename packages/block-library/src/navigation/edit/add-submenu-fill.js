/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';
import { addSubmenu } from '@wordpress/icons';
import { MenuItem } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect, useRef, useState } from '@wordpress/element';
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
	toggleElement,
	setAnchorContext,
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

				// When the block was converted to a submenu, the
				// original toggleElement is unmounted. Pass the new
				// block's clientId so the popover anchor and focus
				// restoration can find the replacement row's button.
				if ( setAnchorContext ) {
					const wasConverted = expandClientId !== clientId;
					setAnchorContext( {
						toggleElement: wasConverted ? null : toggleElement,
						clientId: expandClientId,
					} );
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
	const anchorContextRef = useRef( null );

	const setAnchorContext = ( context ) => {
		anchorContextRef.current = context;
	};

	// Resolve the popover anchor from the anchor context. When the
	// block wasn't converted, toggleElement is the Options button
	// we can use directly. When it was converted to a submenu, the
	// original element is unmounted, so we look up the new block's
	// Options button by clientId.
	useEffect( () => {
		if ( insertedBlock && anchorContextRef.current ) {
			const { toggleElement, clientId } = anchorContextRef.current;
			const anchor =
				toggleElement ??
				document.querySelector(
					`[data-block="${ clientId }"] .block-editor-list-view-block__menu`
				);
			setPopoverAnchor( anchor );
		}
	}, [ insertedBlock ] );

	// When the link popover closes (insertedBlock becomes null),
	// return focus to the anchor button.
	//
	// setTimeout( …, 0 ) is required because the Popover's
	// useFocusReturn hook fires during the React commit phase
	// (via a ref callback) and would move focus away from our
	// target. Deferring to the next event loop tick ensures our
	// focus() call runs after useFocusReturn has finished.
	useEffect( () => {
		if ( ! insertedBlock && popoverAnchor ) {
			const element = popoverAnchor;
			setPopoverAnchor( null );
			anchorContextRef.current = null;

			const timerId = window.setTimeout( () => {
				element?.focus();
			}, 0 );

			return () => window.clearTimeout( timerId );
		}
	}, [ insertedBlock, popoverAnchor ] );

	return (
		<>
			<BlockSettingsMenuControls supportsContentOnly>
				{ ( fillProps ) => (
					<AddSubmenuFillContent
						navigationBlockClientId={ navigationBlockClientId }
						{ ...fillProps }
						setInsertedBlock={ setInsertedBlock }
						setAnchorContext={ setAnchorContext }
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
	toggleElement,
	setAnchorContext,
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
			toggleElement={ toggleElement }
			setAnchorContext={ setAnchorContext }
		/>
	);
}

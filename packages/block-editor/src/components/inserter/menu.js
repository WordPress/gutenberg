/**
 * External dependencies
 */
import { includes, pick } from 'lodash';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { LEFT, RIGHT, UP, DOWN, BACKSPACE, ENTER } from '@wordpress/keycodes';
import { TabPanel } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { isUnmodifiedDefaultBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import Tips from './tips';
import InserterSearchForm from './search-form';
import InserterPreviewPanel from './preview-panel';
import InserterBlockList from './block-list';
import BlockPatterns from './block-patterns';

const stopKeyPropagation = ( event ) => event.stopPropagation();

function InserterMenu( {
	rootClientId,
	clientId,
	isAppender,
	__experimentalSelectBlockOnInsert,
	onSelect,
	showInserterHelpPanel,
} ) {
	const [ filterValue, setFilterValue ] = useState( '' );
	const [ hoveredItem, setHoveredItem ] = useState( null );
	const {
		destinationRootClientId,
		patterns,
		getSelectedBlock,
		getBlockIndex,
		getBlockSelectionEnd,
		getBlockOrder,
	} = useSelect( ( select ) => {
		const {
			getSettings,
			getBlockRootClientId,
			getBlockSelectionEnd: _getBlockSelectionEnd,
		} = select( 'core/block-editor' );

		let destRootClientId = rootClientId;
		if ( ! destRootClientId && ! clientId && ! isAppender ) {
			const end = _getBlockSelectionEnd();
			if ( end ) {
				destRootClientId = getBlockRootClientId( end ) || undefined;
			}
		}
		return {
			patterns: getSettings().__experimentalBlockPatterns,
			destinationRootClientId: destRootClientId,
			...pick( select( 'core/block-editor' ), [
				'getSelectedBlock',
				'getBlockIndex',
				'getBlockSelectionEnd',
				'getBlockOrder',
			] ),
		};
	}, [] );
	const {
		replaceBlocks,
		insertBlocks,
		showInsertionPoint,
		hideInsertionPoint,
	} = useDispatch( 'core/block-editor' );
	const hasPatterns =
		! destinationRootClientId && !! patterns && !! patterns.length;
	const onKeyDown = ( event ) => {
		if (
			includes(
				[ LEFT, DOWN, RIGHT, UP, BACKSPACE, ENTER ],
				event.keyCode
			)
		) {
			// Stop the key event from propagating up to ObserveTyping.startTypingInTextField.
			event.stopPropagation();
		}
	};

	// To avoid duplication, getInsertionIndex is extracted and used in two event handlers
	// This breaks the withDispatch not containing any logic rule.
	// Since it's a function only called when the event handlers are called,
	// it's fine to extract it.
	// eslint-disable-next-line no-restricted-syntax
	function getInsertionIndex() {
		// If the clientId is defined, we insert at the position of the block.
		if ( clientId ) {
			return getBlockIndex( clientId, destinationRootClientId );
		}

		// If there a selected block, we insert after the selected block.
		const end = getBlockSelectionEnd();
		if ( ! isAppender && end ) {
			return getBlockIndex( end, destinationRootClientId ) + 1;
		}

		// Otherwise, we insert at the end of the current rootClientId
		return getBlockOrder( destinationRootClientId ).length;
	}

	const onInsertBlocks = ( blocks ) => {
		const selectedBlock = getSelectedBlock();
		if (
			! isAppender &&
			selectedBlock &&
			isUnmodifiedDefaultBlock( selectedBlock )
		) {
			replaceBlocks( selectedBlock.clientId, blocks );
		} else {
			insertBlocks(
				blocks,
				getInsertionIndex(),
				destinationRootClientId,
				__experimentalSelectBlockOnInsert
			);
		}

		onSelect();
	};

	const onHover = ( item ) => {
		setHoveredItem( item );
		if ( item ) {
			const index = getInsertionIndex();
			showInsertionPoint( destinationRootClientId, index );
		} else {
			hideInsertionPoint();
		}
	};

	const blocksTab = (
		<>
			<div className="block-editor-inserter__block-list">
				<div className="block-editor-inserter__scrollable">
					<InserterBlockList
						rootClientId={ destinationRootClientId }
						onInsert={ onInsertBlocks }
						onHover={ onHover }
						__experimentalSelectBlockOnInsert={
							__experimentalSelectBlockOnInsert
						}
						filterValue={ filterValue }
					/>
				</div>
			</div>
			{ showInserterHelpPanel && (
				<div className="block-editor-inserter__tips">
					<Tips />
				</div>
			) }
		</>
	);

	const patternsTab = (
		<div className="block-editor-inserter__scrollable">
			<BlockPatterns
				patterns={ patterns }
				onInsert={ onInsertBlocks }
				filterValue={ filterValue }
			/>
		</div>
	);

	// Disable reason (no-autofocus): The inserter menu is a modal display, not one which
	// is always visible, and one which already incurs this behavior of autoFocus via
	// Popover's focusOnMount.
	// Disable reason (no-static-element-interactions): Navigational key-presses within
	// the menu are prevented from triggering WritingFlow and ObserveTyping interactions.
	/* eslint-disable jsx-a11y/no-autofocus, jsx-a11y/no-static-element-interactions */
	return (
		<div
			className="block-editor-inserter__menu"
			onKeyPress={ stopKeyPropagation }
			onKeyDown={ onKeyDown }
		>
			<div className="block-editor-inserter__main-area">
				<InserterSearchForm onChange={ setFilterValue } />
				{ hasPatterns && (
					<TabPanel
						className="block-editor-inserter__tabs"
						tabs={ [
							{
								name: 'blocks',
								/* translators: Blocks tab title in the block inserter. */
								title: __( 'Blocks' ),
							},
							{
								name: 'patterns',
								/* translators: Patterns tab title in the block inserter. */
								title: __( 'Patterns' ),
							},
						] }
					>
						{ ( tab ) => {
							if ( tab.name === 'blocks' ) {
								return blocksTab;
							}
							return patternsTab;
						} }
					</TabPanel>
				) }
				{ ! hasPatterns && blocksTab }
			</div>
			{ showInserterHelpPanel && hoveredItem && (
				<div className="block-editor-inserter__preview-container">
					<InserterPreviewPanel item={ hoveredItem } />
				</div>
			) }
		</div>
	);
	/* eslint-enable jsx-a11y/no-autofocus, jsx-a11y/no-static-element-interactions */
}

export default InserterMenu;

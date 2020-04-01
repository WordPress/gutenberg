/**
 * External dependencies
 */
import { includes } from 'lodash';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { LEFT, RIGHT, UP, DOWN, BACKSPACE, ENTER } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import Tips from './tips';
import InserterSearchForm from './search-form';
import InserterPreviewPanel from './preview-panel';
import InserterBlockList from './block-list';

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
				<InserterBlockList
					rootClientId={ rootClientId }
					clientId={ clientId }
					isAppender={ isAppender }
					onSelect={ onSelect }
					onHover={ setHoveredItem }
					__experimentalSelectBlockOnInsert={
						__experimentalSelectBlockOnInsert
					}
					filterValue={ filterValue }
				/>
				{ showInserterHelpPanel && (
					<div className="block-editor-inserter__tips">
						<Tips />
					</div>
				) }
			</div>
			{ showInserterHelpPanel && hoveredItem && (
				<InserterPreviewPanel item={ hoveredItem } />
			) }
		</div>
	);
	/* eslint-enable jsx-a11y/no-autofocus, jsx-a11y/no-static-element-interactions */
}

export default InserterMenu;

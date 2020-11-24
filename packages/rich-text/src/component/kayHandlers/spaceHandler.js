/**
 * WordPress dependencies
 */
import {isCaretAtLineStart, isModifierKey,} from '@wordpress/packages/rich-text/src/component/utils';
import {isCollapsed} from '@wordpress/rich-text';

export const areHandlingSpaceConditionsMet = ( {
	isElementAListItem,
	recordData,
	event,
} ) =>
	isElementAListItem &&
	isCaretAtLineStart( recordData ) &&
	// toDo fix argument
	! isCollapsed( recordData ) &&
	! isModifierKey( event );

/**
 * External dependencies
 */
import {identity, pipe, tap} from 'ramda';
/**
 * WordPress dependencies
 */
import {indentListItems} from '@wordpress/packages/rich-text/src/indent-list-items';
import {
	handleHorizontalNavigationLogic,
	prepareDeleteEvent,
	prepareEnterEvent,
} from '@wordpress/packages/rich-text/src/component/handlers';

export const getHandlersFns = ( {
	handlersConditions: {
		areHandlingSpaceConditionsMet,
		areHorizontalNavigationConditionsMet,
	},
	multilineRootTag,
	record,
	recordData,
	undo,
	didAutomaticChange,
	onEnter,
	handleChange,
} ) => ( {
	spaceHandler: areHandlingSpaceConditionsMet
		? pipe(
				indentListItems( recordData, { type: multilineRootTag } ),
				handleChange
		  )
		: identity,
	deleteHandler: didAutomaticChange ? undo : prepareDeleteEvent,
	escapeHandler: didAutomaticChange ? undo : identity,
	enterHandler: pipe( prepareEnterEvent, onEnter ),
	horizontalNavigationHandler: areHorizontalNavigationConditionsMet
		? pipe(
				handleHorizontalNavigationLogic,
				tap( ( newRecord ) => ( record.current = newRecord ) )
		  )
		: identity,
} );

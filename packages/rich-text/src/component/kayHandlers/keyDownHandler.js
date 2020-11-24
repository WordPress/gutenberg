/**
 * WordPress dependencies
 */
import {
	getDirection,
	getRecordData,
	whenKeyCode,
	whenOneOfKeyCodes,
} from '@wordpress/packages/rich-text/src/component/utils';
/**
 * External dependencies
 */
import {pipe, thunkify} from 'ramda';
import {DELETE, ENTER, ESCAPE, LEFT, RIGHT, SPACE,} from '@wordpress/keycodes/src';
import {getHandlersData} from '@wordpress/packages/rich-text/src/component/kayHandlers/getHandlersData';
import {getHandlersConditions} from '@wordpress/packages/rich-text/src/component/kayHandlers/getHandlersConditions';
import {getHandlersFns} from '@wordpress/packages/rich-text/src/component/kayHandlers/getHandlersFns';

const keyDownHandler = ( {
	handlersData: {
		handleHorizontalNavigationData,
		handlerEnterData,
		handleDeleteData,
	},
	handlersFns: {
		spaceHandler,
		escapeHandler,
		enterHandler,
		horizontalNavigationHandler,
		deleteHandler,
	},
} ) =>
	pipe(
		whenKeyCode( SPACE, spaceHandler, {} ),
		whenKeyCode( ENTER, enterHandler, handlerEnterData ),
		whenKeyCode( ESCAPE, escapeHandler, {} ),
		whenOneOfKeyCodes( [ ENTER, DELETE ], deleteHandler, handleDeleteData ),
		whenOneOfKeyCodes(
			[ LEFT, RIGHT ],
			horizontalNavigationHandler,
			handleHorizontalNavigationData
		)
	);

export const handleKeyDown = ( {
	ref,
	getWin,
	multilineTag,
	formatTypes,
	didAutomaticChange,
	undo,
	onSelectionChange,
	setActiveFormats,
	record,
	placeholder,
	handleChange,
	onDelete,
	multilineRootTag,
	activeFormats,
	preserveWhiteSpace,
	onEnter,
} ) => ( event ) => {
	if ( event.defaultPrevented ) {
		return;
	}
	const recordData = getRecordData( {
		ref,
		getWin,
		multilineTag,
		preserveWhiteSpace,
	} );
	const handlersData = getHandlersData( {
		multilineTag,
		formatTypes,
		onSelectionChange,
		setActiveFormats,
		record,
		placeholder,
		handleChange,
		onDelete,
		recordData,
		activeFormats,
	} );
	const handlersConditions = getHandlersConditions( {
		recordData,
		getDirection: thunkify( getDirection )( { getWin, ref } ),
		isElementAListItem: multilineTag === 'li',
		currentRecord: record.current,
		event,
	} );
	const handlersFns = getHandlersFns( {
		handlersConditions,
		multilineRootTag,
		record,
		recordData,
		undo,
		didAutomaticChange,
		onEnter,
		handleChange,
	} );
	keyDownHandler( {
		handlersData,
		handlersFns,
		event,
	} );
};

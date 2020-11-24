/**
 * WordPress dependencies
 */
import {LEFT, RIGHT} from '@wordpress/keycodes/src';
/**
 * Internal dependencies
 */
import {applyRecord, getLonger, isDescending, isModifierKey,} from '../utils/misc.js';
import {isCollapsed} from '@wordpress/rich-text';
import {getCanCaretMoveInChosenDirection} from '@wordpress/packages/rich-text/src/component/utils/getCanCaretMoveInChosenDirection';

const EMPTY_ACTIVE_FORMATS = [];

const getNewActiveFormatLength = ( {
	formatsBefore,
	formatsAfter,
	currentActiveFormats,
	isReverse,
} ) => {
	const hasPaddingRight =
		isReverse &&
		isDescending( [ formatsBefore, formatsAfter, currentActiveFormats ] );

	const hasPaddingLeft =
		//toDo fix it
		isReverse &&
		isDescending( [ currentActiveFormats, formatsBefore, formatsAfter ]);

	return (
		currentActiveFormats.length +
		Number( hasPaddingRight ) -
		Number( hasPaddingLeft )
	);
};

export const getNewActiveFormatsData = ( {
	currentActiveFormats,
	isReverse,
	formats,
	start,
} ) => {
	const [ formatsBefore, formatsAfter ] = [
		( formats[ start - 1 ] = EMPTY_ACTIVE_FORMATS ),
		( formats[ start ] = EMPTY_ACTIVE_FORMATS ),
	];
	const source = getLonger( formatsBefore, formatsAfter );

	const newActiveFormatsLength = getNewActiveFormatLength( {
		formatsBefore,
		formatsAfter,
		currentActiveFormats,
		isReverse,
	} );
	// If the amount of formats before the caret and after the caret is
	// different, the caret is at a format boundary.

	const doesFormatLengthMatch =
		newActiveFormatsLength === currentActiveFormats.length;

	const formatPart = isReverse ? formatsBefore : formatsAfter;

	const newActiveFormats = doesFormatLengthMatch
		? formatPart
		: source.slice( 0, newActiveFormatsLength );
	return { newActiveFormats, doesFormatLengthMatch };
};

const doHorizontalNavigation = ( currentRecord ) => ( event ) => {
	const {
		formats,
		start,
		getDirection,
		activeFormats: currentActiveFormats = [],
	} = currentRecord;
	// To do: ideally, we should look at visual position instead.

	const reverseKey = getDirection() === 'rtl' ? RIGHT : LEFT;
	const isReverse = event.keyCode === reverseKey;
	const {
		newActiveFormats,
		doesFormatLengthMatch,
	} = getNewActiveFormatsData( { currentActiveFormats, isReverse, formats } );
	const newPos = start + ( isReverse ? -1 : 1 );
	const updatedPositions = doesFormatLengthMatch
		? {
				start: newPos,
				end: newPos,
		  }
		: {};
	const newRecord = {
		...currentRecord,
		activeFormats: newActiveFormats,
		...updatedPositions,
	};

	return {
		newRecord,
		doesFormatLengthMatch,
	};
};
/**
 * Handles horizontal keyboard navigation when no modifiers are pressed. The
 * navigation is handled separately to move correctly around format
 * boundaries.
 *
 * @param {WPSyntheticEvent} event A synthetic keyboard event.
 */
export const handleHorizontalNavigationLogic = ( {
	placeholder,
	currentRecord,
	onSelectionChange,
	setActiveFormats,
} ) => ( event ) => {
	const { newRecord, doesFormatLengthMatch } = doHorizontalNavigation(
		currentRecord
	)( event );

	applyRecord( { newRecord, placeholder } );
	if ( doesFormatLengthMatch )
		onSelectionChange( newRecord.start, newRecord.start );
	setActiveFormats( newRecord.activeFormats );
	return newRecord;
};

// If the selection is not collapsed, let the browser handle collapsing
// the selection for now. Later we could expand this logic to set
// boundary positions if needed.
export const areHorizontalNavigationConditionsMet = ( {
	currentRecord,
	event,
	getDirection,
} ) =>
	isCollapsed( currentRecord ) &&
	! isModifierKey( event ) &&
	getCanCaretMoveInChosenDirection( currentRecord, getDirection, event );

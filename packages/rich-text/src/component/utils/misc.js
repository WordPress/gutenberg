/**
 * WordPress dependencies
 */

/**
 * External dependencies
 */
import {
	assoc,
	curry,
	equals,
	filter,
	identity,
	isEmpty,
	isNil,
	not,
	pipe,
	pluck,
	prop,
	reduce,
	sort,
	when,
} from 'ramda';
import {create, removeFormat,} from '@wordpress/packages/rich-text';
import {apply} from '@wordpress/packages/rich-text/src/to-dom';
import {LINE_SEPARATOR} from '@wordpress/packages/rich-text/src/special-characters';
import {formatToValue} from '@wordpress/packages/rich-text/src/component/utils/formatToValue';

export const getRecordData = ( {
	ref,
	getWin,
	multilineTag,
	preserveWhiteSpace,
} ) => ( {
	element: ref.current,
	range: getRange( getWin().getSelection() ),
	multilineTag,
	preserveWhiteSpace,
} );
export const getOwnerDocument = ( ref ) => ref.current.ownerDocument;

export const getDefaultView = ( ref ) =>
	getOwnerDocument( ref ).defaultView;

export const getDirection = ( { getWin, ref } ) =>
	getWin().getComputedStyle( ref.current ).direction;

export const getInitialRecord = ( {
	selectionStart: start,
	selectionEnd: end,
	...formatData
} ) => ( {
	...formatToValue( formatData ),
	start,
	end,
} );

export const isModifierKey = ( { shiftKey, altKey, metaKey, ctrlKey } ) =>
	[ shiftKey, altKey, metaKey, ctrlKey ].find( identity );

const _createPrepareEditableTree = ( fns, { text, formats } ) =>
	fns.reduce( ( accumulator, fn ) => fn( accumulator, text ), formats );

export const createPrepareEditableTree = curry( _createPrepareEditableTree );

/**
 * Removes editor only formats from the value.
 *
 * Editor only formats are applied using `prepareEditableTree`, so we need to
 * remove them before converting the internal state
 *
 * @param root0
 * @param root0.val
 * @param root0.formatTypes
 * @return {Object} A new rich-text value.
 */
export const removeEditorOnlyFormats = ( { val, formatTypes } ) => {
	// Remove formats created by prepareEditableTree, because they are editor only.

	const removedFormats = pipe(
		filter( pluck( '__experimentalCreatePrepareEditableTree' ) ),
		reduce(
			( acc, curr ) => removeFormat( acc, curr.name, 0, acc.text.length ),
			{}
		)
	)( formatTypes );

	return isEmpty( removedFormats ) ? val : removedFormats;
};

export const getRange = ( selection ) =>
	selection.rangeCount > 0 ? selection.getRangeAt( 0 ) : null;

const _whenNoModifierKeyPresses = ( f, event ) =>
	isModifierKey( event ) ? identity : f;

export const whenNoModifierKeyPresses = curry( _whenNoModifierKeyPresses );

export const preventDefault = curry( ( f, e ) => (e.preventDefault(), f( e )) );

const _whenKeyCode = ( keyCode, f, fArgs, event ) =>
	( event.keyCode === keyCode ? preventDefault( f( fArgs ) ) : identity )(
		event
	);

export const whenKeyCode = curry( _whenKeyCode );

const _whenOneOfKeyCodes = ( keyCodes, f, event ) =>
	( keyCodes.includes( event.keyCode ) ? preventDefault( f ) : identity )(
		event
	);

export const whenOneOfKeyCodes = curry( _whenOneOfKeyCodes );

export const applyMultilineTagWhenNeeded = when(
	equals( 'li', prop( 'multilineTag' ) ),
	assoc( 'multilineWrapperTags', [ 'ul', 'ol' ] )
);

export const isNotNil = ( x ) => not( isNil( x ) );
const assocMissingProps = ( { prepareHandlers, domOnly, ...props } ) => ( {
	__unstableDomOnly: domOnly,
	prepareEditableTree: createPrepareEditableTree( prepareHandlers ),
	...props,
} );
/**
 * @param props.multilineTag
 * @param props.current
 * @param props.placeholder
 * @param {Object} props .
 * @param props.value
 * @param props.domOnly
 * @param props.prepareHandlers
 */
export const applyRecord = pipe(
	applyMultilineTagWhenNeeded,
	assocMissingProps,
	apply
);

export const createRecord = pipe(
	applyMultilineTagWhenNeeded,
	assoc( '__unstableIsEditableTree', true ),
	create
);

export const isCaretAtLineStart = ( currentValue ) => {
	const { text, start } = currentValue;
	const characterBefore = text[ start - 1 ];
	return ! ( characterBefore && characterBefore !== LINE_SEPARATOR );
};

export const isKeyCode = ( keyCode ) => ( event ) =>
	( event.keyCode = keyCode );

export const getLonger = curry( ( a, b ) => ( a.length > b.length ? a : b ) );
export const isDescending = ( arr ) =>
	equals(
		sort( ( a, b ) => b - a, arr ),
		arr
	);

export const isLonger = ( a, b ) => a.length > b.length;
export const isLongest = ( a, ...rest ) => a.length > Math.max( ...rest );

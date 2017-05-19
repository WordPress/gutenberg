import { compact, isEqual, range as _range, mapKeys } from 'lodash';

function getTextRecord( element, range ) {
	const record = {
		value: {
			formats: {},
			text: '',
		},
		selection: {},
	};

	if ( element.nodeName === 'BR' ) {
		record.value.text = '\n';
		return record;
	}

	return Array.from( element.childNodes ).reduce( ( accumulator, node ) => {
		if ( node === range.startContainer ) {
			accumulator.selection.start = accumulator.value.text.length + range.startOffset;
		}

		if ( node === range.endContainer ) {
			accumulator.selection.end = accumulator.value.text.length + range.endOffset;
		}

		if ( node.nodeType === 3 ) {
			accumulator.value.text += node.nodeValue;
		}

		if ( node.nodeType === 1 ) {
			const type = node.nodeName.toLowerCase();
			const { selection, value } = getTextRecord( node, range );
			const attributes = getAttributes( node );
			const start = accumulator.value.text.length;
			const end = start + value.text.length;

			accumulator.value.text += value.text;
			accumulator.value.formats = _range( start, end ).reduce( ( formats, index ) => {
				return {
					...accumulator.value.formats,
					...formats,
					[ index ]: [
						...( formats[ index ] || [] ),
						{ type, ...attributes },
					],
				};
			}, mapKeys( value.formats, ( format, index ) => {
				return start + parseInt( index, 10 );
			} ) );

			if ( selection.start !== undefined ) {
				accumulator.selection.start = start + selection.start;
			}

			if ( selection.end !== undefined ) {
				accumulator.selection.end = start + selection.end;
			}
		}

		return accumulator;
	}, record );
}

function getAttributes( element ) {
	if ( ! element.hasAttributes() ) {
		return {};
	}

	return Array.from( element.attributes ).reduce( ( acc, { name, value } ) => ( {
		...acc, [ name ]: value,
	} ), {} );
}

function getTextRecordList( nodeList, range ) {
	return Array.from( nodeList ).reduce( ( acc, element, index ) => {
		const { selection, value } = getTextRecord( element, range );

		value.attributes = getAttributes( element );
		acc.value.push( value );

		if ( selection.start !== undefined ) {
			acc.selection.start = [ index ].concat( selection.start );
		} else if ( element === range.startContainer ) {
			acc.selection.start = [ index ];
		}

		if ( selection.end !== undefined ) {
			acc.selection.end = [ index ].concat( selection.end );
		} else if ( element === range.endContainer ) {
			acc.selection.end = [ index ];
		}

		return acc;
	}, {
		value: [],
		selection: {},
	} );
}

export function toState( element, range, { inline } ) {
	if ( inline ) {
		return getTextRecord( element, range );
	}

	return getTextRecordList( element.hasChildNodes() ? element.childNodes : [], range );
}

export function isEmpty( { value } ) {
	const isEmptyText = ( { text } ) => ! text || text === '\n';

	if ( Array.isArray( value ) ) {
		if ( value.length !== 1 ) {
			return ! value.length;
		}

		return isEmptyText( value[ 0 ] );
	}

	return isEmptyText( value );
}

const isCollapsed = ( selection ) => isEqual( selection.start, selection.end );

export function atStart( { selection } ) {
	return selection.start && isCollapsed( selection ) && ! compact( selection.start ).length;
}

export function atEnd( { selection, value } ) {
	if ( ! selection.start || ! isCollapsed( selection ) ) {
		return false;
	}

	if ( Array.isArray( value ) ) {
		const [ arrayIndex, stringIndex ] = selection.start;

		if ( value.length - 1 !== arrayIndex ) {
			return false;
		}

		return value[ arrayIndex ].text.length === stringIndex;
	}

	return value.text.length === selection.start;
}

export function getFormats( { selection, value } ) {
	if ( ! selection.start ) {
		return [];
	}

	const charOffset = isCollapsed( selection ) ? -1 : 0;

	if ( Array.isArray( value ) ) {
		const [ arrayIndex, stringIndex ] = selection.start;

		return value[ arrayIndex ].formats[ stringIndex + charOffset ] || [];
	}

	return value.formats[ selection.start + charOffset ] || [];
}

// File copied https://github.com/slab/delta/blob/main/src/Delta.ts with changes:
// - fast-diff swapped out for 'diff',
// - lodash.clonedeep is replaced with JSON parse / stringify
// - lodash.isequal is replaced with fast-deep-equal.

// @ts-ignore
/**
 * External dependencies
 */
import type { Change } from 'diff';
import { diffChars } from 'diff';
import { default as isEqual } from 'fast-deep-equal/es6';

/**
 * Internal dependencies
 */
import AttributeMap from './AttributeMap';
import Op from './Op';
import OpIterator from './OpIterator';

function cloneDeep< T >( value: T ): T {
	return JSON.parse( JSON.stringify( value ) ) as T;
}

const NULL_CHARACTER = String.fromCharCode( 0 ); // Placeholder char for embed in diff()

interface EmbedHandler< T > {
	compose: ( a: T, b: T, keepNull: boolean ) => T;
	invert: ( a: T, b: T ) => T;
	transform: ( a: T, b: T, priority: boolean ) => T;
}

const getEmbedTypeAndData = (
	a: Op[ 'insert' ] | Op[ 'retain' ],
	b: Op[ 'insert' ]
): [ string, unknown, unknown ] => {
	if ( typeof a !== 'object' || a === null ) {
		throw new Error( `cannot retain a ${ typeof a }` );
	}
	if ( typeof b !== 'object' || b === null ) {
		throw new Error( `cannot retain a ${ typeof b }` );
	}
	const embedType = Object.keys( a )[ 0 ];
	if ( ! embedType || embedType !== Object.keys( b )[ 0 ] ) {
		throw new Error(
			`embed types not matched: ${ embedType } != ${
				Object.keys( b )[ 0 ]
			}`
		);
	}
	return [ embedType, a[ embedType ], b[ embedType ] ];
};

class Delta {
	static Op = Op;
	static OpIterator = OpIterator;
	static AttributeMap = AttributeMap;
	private static handlers: {
		[ embedType: string ]: EmbedHandler< unknown >;
	} = {};

	static registerEmbed< T >(
		embedType: string,
		handler: EmbedHandler< T >
	): void {
		this.handlers[ embedType ] = handler as EmbedHandler< unknown >;
	}

	static unregisterEmbed( embedType: string ): void {
		delete this.handlers[ embedType ];
	}

	private static getHandler( embedType: string ): EmbedHandler< unknown > {
		const handler = this.handlers[ embedType ];
		if ( ! handler ) {
			throw new Error( `no handlers for embed type "${ embedType }"` );
		}
		return handler;
	}

	ops: Op[];
	constructor( ops?: Op[] | { ops: Op[] } ) {
		// Assume we are given a well formed ops
		if ( Array.isArray( ops ) ) {
			this.ops = ops;
		} else if (
			ops !== null &&
			ops !== undefined &&
			Array.isArray( ops.ops )
		) {
			this.ops = ops.ops;
		} else {
			this.ops = [];
		}
	}

	insert(
		arg: string | Record< string, unknown >,
		attributes?: AttributeMap | null
	): this {
		const newOp: Op = {};
		if ( typeof arg === 'string' && arg.length === 0 ) {
			return this;
		}
		newOp.insert = arg;
		if (
			attributes !== null &&
			attributes !== undefined &&
			typeof attributes === 'object' &&
			Object.keys( attributes ).length > 0
		) {
			newOp.attributes = attributes;
		}
		return this.push( newOp );
	}

	delete( length: number ): this {
		if ( length <= 0 ) {
			return this;
		}
		return this.push( { delete: length } );
	}

	retain(
		length: number | Record< string, unknown >,
		attributes?: AttributeMap | null
	): this {
		if ( typeof length === 'number' && length <= 0 ) {
			return this;
		}
		const newOp: Op = { retain: length };
		if (
			attributes !== null &&
			attributes !== undefined &&
			typeof attributes === 'object' &&
			Object.keys( attributes ).length > 0
		) {
			newOp.attributes = attributes;
		}
		return this.push( newOp );
	}

	push( newOp: Op ): this {
		let index = this.ops.length;
		let lastOp = this.ops[ index - 1 ];
		newOp = cloneDeep( newOp );
		if ( typeof lastOp === 'object' ) {
			if (
				typeof newOp.delete === 'number' &&
				typeof lastOp.delete === 'number'
			) {
				this.ops[ index - 1 ] = {
					delete: lastOp.delete + newOp.delete,
				};
				return this;
			}
			// Since it does not matter if we insert before or after deleting at the same index,
			// always prefer to insert first
			if (
				typeof lastOp.delete === 'number' &&
				newOp.insert !== null &&
				newOp.insert !== undefined
			) {
				index -= 1;
				lastOp = this.ops[ index - 1 ];
				if ( typeof lastOp !== 'object' ) {
					this.ops.unshift( newOp );
					return this;
				}
			}
			if ( isEqual( newOp.attributes, lastOp.attributes ) ) {
				if (
					typeof newOp.insert === 'string' &&
					typeof lastOp.insert === 'string'
				) {
					this.ops[ index - 1 ] = {
						insert: lastOp.insert + newOp.insert,
					};
					if ( typeof newOp.attributes === 'object' ) {
						this.ops[ index - 1 ].attributes = newOp.attributes;
					}
					return this;
				} else if (
					typeof newOp.retain === 'number' &&
					typeof lastOp.retain === 'number'
				) {
					this.ops[ index - 1 ] = {
						retain: lastOp.retain + newOp.retain,
					};
					if ( typeof newOp.attributes === 'object' ) {
						this.ops[ index - 1 ].attributes = newOp.attributes;
					}
					return this;
				}
			}
		}
		if ( index === this.ops.length ) {
			this.ops.push( newOp );
		} else {
			this.ops.splice( index, 0, newOp );
		}
		return this;
	}

	chop(): this {
		const lastOp = this.ops[ this.ops.length - 1 ];
		if (
			lastOp &&
			typeof lastOp.retain === 'number' &&
			! lastOp.attributes
		) {
			this.ops.pop();
		}
		return this;
	}

	filter( predicate: ( op: Op, index: number ) => boolean ): Op[] {
		return this.ops.filter( predicate );
	}

	forEach( predicate: ( op: Op, index: number ) => void ): void {
		this.ops.forEach( predicate );
	}

	map< T >( predicate: ( op: Op, index: number ) => T ): T[] {
		return this.ops.map( predicate );
	}

	partition( predicate: ( op: Op ) => boolean ): [ Op[], Op[] ] {
		const passed: Op[] = [];
		const failed: Op[] = [];
		this.forEach( ( op ) => {
			const target = predicate( op ) ? passed : failed;
			target.push( op );
		} );
		return [ passed, failed ];
	}

	reduce< T >(
		predicate: ( accum: T, curr: Op, index: number ) => T,
		initialValue: T
	): T {
		return this.ops.reduce( predicate, initialValue );
	}

	changeLength(): number {
		return this.reduce( ( length, elem ) => {
			if ( elem.insert ) {
				return length + Op.length( elem );
			} else if ( elem.delete ) {
				return length - elem.delete;
			}
			return length;
		}, 0 );
	}

	length(): number {
		return this.reduce( ( length, elem ) => {
			return length + Op.length( elem );
		}, 0 );
	}

	slice( start = 0, end = Infinity ): Delta {
		const ops = [];
		const iter = new OpIterator( this.ops );
		let index = 0;
		while ( index < end && iter.hasNext() ) {
			let nextOp;
			if ( index < start ) {
				nextOp = iter.next( start - index );
			} else {
				nextOp = iter.next( end - index );
				ops.push( nextOp );
			}
			index += Op.length( nextOp );
		}
		return new Delta( ops );
	}

	compose( other: Delta ): Delta {
		const thisIter = new OpIterator( this.ops );
		const otherIter = new OpIterator( other.ops );
		const ops = [];
		const firstOther = otherIter.peek();
		if (
			firstOther !== null &&
			firstOther !== undefined &&
			typeof firstOther.retain === 'number' &&
			( firstOther.attributes === null ||
				firstOther.attributes === undefined )
		) {
			let firstLeft = firstOther.retain;
			while (
				thisIter.peekType() === 'insert' &&
				thisIter.peekLength() <= firstLeft
			) {
				firstLeft -= thisIter.peekLength();
				ops.push( thisIter.next() );
			}
			if ( firstOther.retain - firstLeft > 0 ) {
				otherIter.next( firstOther.retain - firstLeft );
			}
		}
		const delta = new Delta( ops );
		while ( thisIter.hasNext() || otherIter.hasNext() ) {
			if ( otherIter.peekType() === 'insert' ) {
				delta.push( otherIter.next() );
			} else if ( thisIter.peekType() === 'delete' ) {
				delta.push( thisIter.next() );
			} else {
				const length = Math.min(
					thisIter.peekLength(),
					otherIter.peekLength()
				);
				const thisOp = thisIter.next( length );
				const otherOp = otherIter.next( length );
				if ( otherOp.retain ) {
					const newOp: Op = {};
					if ( typeof thisOp.retain === 'number' ) {
						newOp.retain =
							typeof otherOp.retain === 'number'
								? length
								: otherOp.retain;
					} else if ( typeof otherOp.retain === 'number' ) {
						if (
							thisOp.retain === null ||
							thisOp.retain === undefined
						) {
							newOp.insert = thisOp.insert;
						} else {
							newOp.retain = thisOp.retain;
						}
					} else {
						const action =
							thisOp.retain === null ||
							thisOp.retain === undefined
								? 'insert'
								: 'retain';
						const [ embedType, thisData, otherData ] =
							getEmbedTypeAndData(
								thisOp[ action ],
								otherOp.retain
							);
						const handler = Delta.getHandler( embedType );
						newOp[ action ] = {
							[ embedType ]: handler.compose(
								thisData,
								otherData,
								action === 'retain'
							),
						};
					}
					// Preserve null when composing with a retain, otherwise remove it for inserts
					const attributes = AttributeMap.compose(
						thisOp.attributes,
						otherOp.attributes,
						typeof thisOp.retain === 'number'
					);
					if ( attributes ) {
						newOp.attributes = attributes;
					}
					delta.push( newOp );

					// Optimization if rest of other is just retain
					if (
						! otherIter.hasNext() &&
						isEqual( delta.ops[ delta.ops.length - 1 ], newOp )
					) {
						const rest = new Delta( thisIter.rest() );
						return delta.concat( rest ).chop();
					}

					// Other op should be delete, we could be an insert or retain
					// Insert + delete cancels out
				} else if (
					typeof otherOp.delete === 'number' &&
					( typeof thisOp.retain === 'number' ||
						( typeof thisOp.retain === 'object' &&
							thisOp.retain !== null ) )
				) {
					delta.push( otherOp );
				}
			}
		}
		return delta.chop();
	}

	concat( other: Delta ): Delta {
		const delta = new Delta( this.ops.slice() );
		if ( other.ops.length > 0 ) {
			delta.push( other.ops[ 0 ] );
			delta.ops = delta.ops.concat( other.ops.slice( 1 ) );
		}
		return delta;
	}

	diff( other: Delta ): Delta {
		if ( this.ops === other.ops ) {
			return new Delta();
		}
		const strings = this.deltasToStrings( other );
		const diffResult = diffChars( strings[ 0 ], strings[ 1 ] );
		const thisIter = new OpIterator( this.ops );
		const otherIter = new OpIterator( other.ops );
		const retDelta = this.convertChangesToDelta(
			diffResult,
			thisIter,
			otherIter
		);

		return retDelta.chop();
	}

	eachLine(
		predicate: (
			line: Delta,
			attributes: AttributeMap,
			index: number
		) => boolean | void,
		newline = '\n'
	): void {
		const iter = new OpIterator( this.ops );
		let line = new Delta();
		let i = 0;
		while ( iter.hasNext() ) {
			if ( iter.peekType() !== 'insert' ) {
				return;
			}
			const thisOp = iter.peek();
			const start = Op.length( thisOp ) - iter.peekLength();
			const index =
				typeof thisOp.insert === 'string'
					? thisOp.insert.indexOf( newline, start ) - start
					: -1;
			if ( index < 0 ) {
				line.push( iter.next() );
			} else if ( index > 0 ) {
				line.push( iter.next( index ) );
			} else {
				if (
					predicate( line, iter.next( 1 ).attributes || {}, i ) ===
					false
				) {
					return;
				}
				i += 1;
				line = new Delta();
			}
		}
		if ( line.length() > 0 ) {
			predicate( line, {}, i );
		}
	}

	invert( base: Delta ): Delta {
		const inverted = new Delta();
		this.reduce( ( baseIndex, op ) => {
			if ( op.insert ) {
				inverted.delete( Op.length( op ) );
			} else if (
				typeof op.retain === 'number' &&
				( op.attributes === null || op.attributes === undefined )
			) {
				inverted.retain( op.retain );
				return baseIndex + op.retain;
			} else if ( op.delete || typeof op.retain === 'number' ) {
				const length = ( op.delete || op.retain ) as number;
				const slice = base.slice( baseIndex, baseIndex + length );
				slice.forEach( ( baseOp ) => {
					if ( op.delete ) {
						inverted.push( baseOp );
					} else if ( op.retain && op.attributes ) {
						inverted.retain(
							Op.length( baseOp ),
							AttributeMap.invert(
								op.attributes,
								baseOp.attributes
							)
						);
					}
				} );
				return baseIndex + length;
			} else if ( typeof op.retain === 'object' && op.retain !== null ) {
				const slice = base.slice( baseIndex, baseIndex + 1 );
				const baseOp = new OpIterator( slice.ops ).next();
				const [ embedType, opData, baseOpData ] = getEmbedTypeAndData(
					op.retain,
					baseOp.insert
				);
				const handler = Delta.getHandler( embedType );
				inverted.retain(
					{ [ embedType ]: handler.invert( opData, baseOpData ) },
					AttributeMap.invert( op.attributes, baseOp.attributes )
				);
				return baseIndex + 1;
			}
			return baseIndex;
		}, 0 );
		return inverted.chop();
	}

	transform( index: number, priority?: boolean ): number;
	transform( other: Delta, priority?: boolean ): Delta;
	transform( arg: number | Delta, priority = false ): typeof arg {
		priority = !! priority;
		if ( typeof arg === 'number' ) {
			return this.transformPosition( arg, priority );
		}
		const other: Delta = arg;
		const thisIter = new OpIterator( this.ops );
		const otherIter = new OpIterator( other.ops );
		const delta = new Delta();
		while ( thisIter.hasNext() || otherIter.hasNext() ) {
			if (
				thisIter.peekType() === 'insert' &&
				( priority || otherIter.peekType() !== 'insert' )
			) {
				delta.retain( Op.length( thisIter.next() ) );
			} else if ( otherIter.peekType() === 'insert' ) {
				delta.push( otherIter.next() );
			} else {
				const length = Math.min(
					thisIter.peekLength(),
					otherIter.peekLength()
				);
				const thisOp = thisIter.next( length );
				const otherOp = otherIter.next( length );
				if ( thisOp.delete ) {
					// Our delete either makes their delete redundant or removes their retain
					continue;
				} else if ( otherOp.delete ) {
					delta.push( otherOp );
				} else {
					const thisData = thisOp.retain;
					const otherData = otherOp.retain;
					let transformedData: Op[ 'retain' ] =
						typeof otherData === 'object' && otherData !== null
							? otherData
							: length;
					if (
						typeof thisData === 'object' &&
						thisData !== null &&
						typeof otherData === 'object' &&
						otherData !== null
					) {
						const embedType = Object.keys( thisData )[ 0 ];
						if ( embedType === Object.keys( otherData )[ 0 ] ) {
							const handler = Delta.getHandler( embedType );
							if ( handler ) {
								transformedData = {
									[ embedType ]: handler.transform(
										thisData[ embedType ],
										otherData[ embedType ],
										priority
									),
								};
							}
						}
					}

					// We retain either their retain or insert
					delta.retain(
						transformedData,
						AttributeMap.transform(
							thisOp.attributes,
							otherOp.attributes,
							priority
						)
					);
				}
			}
		}
		return delta.chop();
	}

	transformPosition( index: number, priority = false ): number {
		priority = !! priority;
		const thisIter = new OpIterator( this.ops );
		let offset = 0;
		while ( thisIter.hasNext() && offset <= index ) {
			const length = thisIter.peekLength();
			const nextType = thisIter.peekType();
			thisIter.next();
			if ( nextType === 'delete' ) {
				index -= Math.min( length, index - offset );
				continue;
			} else if (
				nextType === 'insert' &&
				( offset < index || ! priority )
			) {
				index += length;
			}
			offset += length;
		}
		return index;
	}

	/**
	 * Given a Delta and a cursor position, do a diff and attempt to adjust
	 * the diff to place insertions or deletions at the cursor position.
	 *
	 * @param other             - The other Delta to diff against.
	 * @param cursorAfterChange - The cursor position index after the change.
	 * @return A Delta that attempts to place insertions or deletions at the cursor position.
	 */
	diffWithCursor( other: Delta, cursorAfterChange: number | null ): Delta {
		if ( this.ops === other.ops ) {
			return new Delta();
		} else if ( cursorAfterChange === null ) {
			// If no cursor position is provided, do a regular diff.
			return this.diff( other );
		}

		const strings = this.deltasToStrings( other );
		let diffs = diffChars( strings[ 0 ], strings[ 1 ] );
		let lastDiffPosition = 0;
		const adjustedDiffs: Change[] = [];

		for ( let i = 0; i < diffs.length; i++ ) {
			const diff = diffs[ i ];

			const segmentStart = lastDiffPosition;
			const segmentEnd = lastDiffPosition + ( diff.count ?? 0 );
			const isCursorInSegment =
				cursorAfterChange > segmentStart &&
				cursorAfterChange <= segmentEnd;

			const isUnchangedSegment = ! diff.added && ! diff.removed;
			const isRemovalSegment = diff.removed && ! diff.added;

			const nextDiff = diffs[ i + 1 ];
			const isNextDiffAnInsert =
				nextDiff && nextDiff.added && ! nextDiff.removed;

			// Path 1: Look-ahead strategy
			// If the position of the cursor is in an "unchanged" segment, but there's an insertion
			// right after this section, then the insertion has likely been placed in
			// the incorrect spot, and we can move the insertion to the position of the cursor.
			if (
				isUnchangedSegment &&
				isCursorInSegment &&
				isNextDiffAnInsert
			) {
				const movedSegments = this.tryMoveInsertionToCursor(
					diff,
					nextDiff,
					cursorAfterChange,
					segmentStart
				);

				if ( movedSegments ) {
					adjustedDiffs.push( ...movedSegments );
					// Skip the next diff since we've already consumed it
					i++;
					lastDiffPosition = segmentEnd;
					continue;
				}
			}

			// Path 2: Look-back strategy
			// Handle removals by checking if cursor was in the previous unchanged segment
			if ( isRemovalSegment ) {
				const movedSegments = this.tryMoveDeletionToCursor(
					diff,
					adjustedDiffs,
					cursorAfterChange,
					lastDiffPosition
				);

				if ( movedSegments ) {
					// Remove the previous unchanged segment from adjustedDiffs
					adjustedDiffs.pop();
					adjustedDiffs.push( ...movedSegments );
					lastDiffPosition += diff.count ?? 0;
					continue;
				}
			}

			// Path 3: Do nothing - add diff as-is
			adjustedDiffs.push( diff );
			if ( ! diff.added ) {
				lastDiffPosition += diff.count ?? 0;
			}
		}

		diffs = adjustedDiffs;

		const thisIter = new OpIterator( this.ops );
		const otherIter = new OpIterator( other.ops );
		const retDelta = this.convertChangesToDelta(
			diffs,
			thisIter,
			otherIter
		);

		return retDelta.chop();
	}

	/**
	 * Try to move an insertion operation from after an unchanged segment to the cursor position within it.
	 * This is a "look-ahead" strategy.
	 *
	 * @param diff              - The current unchanged diff segment.
	 * @param nextDiff          - The next diff segment (expected to be an insertion).
	 * @param cursorAfterChange - The cursor position after the change.
	 * @param segmentStart      - The start position of the current segment.
	 * @return An array of adjusted diff segments if the insertion was successfully moved, null otherwise.
	 */
	private tryMoveInsertionToCursor(
		diff: Change,
		nextDiff: Change,
		cursorAfterChange: number,
		segmentStart: number
	): Change[] | null {
		const nextDiffInsert = nextDiff.value;
		const insertLength = nextDiffInsert.length;
		const insertOffset = cursorAfterChange - segmentStart - insertLength;

		// Verify that the inserted text matches the text at the cursor position
		const textAtCursor = diff.value.substring(
			insertOffset,
			insertOffset + nextDiffInsert.length
		);
		const isInsertMoveable = textAtCursor === nextDiffInsert;

		// The insert text matches what's at the cursor position,
		// so we can safely move the insertion to the cursor position.
		if ( ! isInsertMoveable ) {
			return null;
		}

		// Split the current segment at the cursor
		const beforeCursor = diff.value.substring( 0, insertOffset );
		const afterCursor = diff.value.substring( insertOffset );

		const result: Change[] = [];

		// Add before cursor part (if not empty)
		if ( beforeCursor.length > 0 ) {
			result.push( {
				value: beforeCursor,
				count: beforeCursor.length,
				added: false,
				removed: false,
			} );
		}

		// Add the insertion in the middle
		result.push( nextDiff );

		// Add after cursor part (if not empty)
		if ( afterCursor.length > 0 ) {
			result.push( {
				value: afterCursor,
				count: afterCursor.length,
				added: false,
				removed: false,
			} );
		}

		return result;
	}

	/**
	 * Try to move a deletion operation to the cursor position by looking back at the previous unchanged segment.
	 * This is a "look-back" strategy.
	 *
	 * @param diff              - The current deletion diff segment.
	 * @param adjustedDiffs     - The array of previously processed diff segments.
	 * @param cursorAfterChange - The cursor position after the change.
	 * @param lastDiffPosition  - The position in the document up to (but not including) the current diff.
	 * @return An array of adjusted diff segments if the deletion was successfully moved, null otherwise.
	 */
	private tryMoveDeletionToCursor(
		diff: Change,
		adjustedDiffs: Change[],
		cursorAfterChange: number,
		lastDiffPosition: number
	): Change[] | null {
		// Check if there's a preceding unchanged segment where cursor falls
		// and the deleted characters match characters in that segment
		const prevDiff = adjustedDiffs[ adjustedDiffs.length - 1 ];

		if ( ! prevDiff || prevDiff.added || prevDiff.removed ) {
			return null;
		}

		const prevSegmentStart = lastDiffPosition - ( prevDiff.count ?? 0 );
		const prevSegmentEnd = lastDiffPosition;

		// Check if cursor is within or at the end of the previous unchanged segment
		if (
			cursorAfterChange < prevSegmentStart ||
			cursorAfterChange >= prevSegmentEnd
		) {
			return null;
		}

		// Check if the deleted characters match the text at the cursor position
		const deletedChars = diff.value;
		const deleteOffset = cursorAfterChange - prevSegmentStart;
		const textAtCursor = prevDiff.value.substring(
			deleteOffset,
			deleteOffset + deletedChars.length
		);
		const canBePlacedHere = textAtCursor === deletedChars;

		if ( ! canBePlacedHere ) {
			return null;
		}

		// Split the unchanged segment at the cursor and place deletion there
		const beforeCursor = prevDiff.value.substring( 0, deleteOffset );
		const atAndAfterCursor = prevDiff.value.substring( deleteOffset );

		// The deletion should consume characters starting at cursor
		const deletionLength = diff.count ?? 0;
		const afterDeletion = atAndAfterCursor.substring( deletionLength );

		const result: Change[] = [];

		// Add before cursor part (if not empty)
		if ( beforeCursor.length > 0 ) {
			result.push( {
				value: beforeCursor,
				count: beforeCursor.length,
				added: false,
				removed: false,
			} );
		}

		// Add the deletion
		result.push( diff );

		// Add after deletion part (if not empty)
		if ( afterDeletion.length > 0 ) {
			result.push( {
				value: afterDeletion,
				count: afterDeletion.length,
				added: false,
				removed: false,
			} );
		}

		return result;
	}

	/**
	 * Convert two Deltas to string representations for diffing.
	 *
	 * @param other - The other Delta to convert.
	 * @return A tuple of [thisString, otherString].
	 */
	private deltasToStrings( other: Delta ): [ string, string ] {
		return [ this, other ].map( ( delta ) => {
			return delta
				.map( ( op ) => {
					if ( op.insert !== null || op.insert !== undefined ) {
						return typeof op.insert === 'string'
							? op.insert
							: NULL_CHARACTER;
					}
					const prep = delta === other ? 'on' : 'with';
					throw new Error(
						'diff() called ' + prep + ' non-document'
					);
				} )
				.join( '' );
		} ) as [ string, string ];
	}

	/**
	 * Process diff changes and convert them to Delta operations.
	 *
	 * @param changes   - The array of changes from the diff algorithm.
	 * @param thisIter  - Iterator for this Delta's operations.
	 * @param otherIter - Iterator for the other Delta's operations.
	 * @return A Delta containing the processed diff operations.
	 */
	private convertChangesToDelta(
		changes: Change[],
		thisIter: OpIterator,
		otherIter: OpIterator
	): Delta {
		const retDelta = new Delta();
		changes.forEach( ( component: Change ) => {
			let length = component.count ?? 0;
			while ( length > 0 ) {
				let opLength = 0;
				if ( component.added ) {
					opLength = Math.min( otherIter.peekLength(), length );
					retDelta.push( otherIter.next( opLength ) );
				} else if ( component.removed ) {
					opLength = Math.min( length, thisIter.peekLength() );
					thisIter.next( opLength );
					retDelta.delete( opLength );
				} else {
					opLength = Math.min(
						thisIter.peekLength(),
						otherIter.peekLength(),
						length
					);
					const thisOp = thisIter.next( opLength );
					const otherOp = otherIter.next( opLength );
					if ( isEqual( thisOp.insert, otherOp.insert ) ) {
						retDelta.retain(
							opLength,
							AttributeMap.diff(
								thisOp.attributes,
								otherOp.attributes
							)
						);
					} else {
						retDelta.push( otherOp ).delete( opLength );
					}
				}
				length -= opLength;
			}
		} );
		return retDelta;
	}
}

export default Delta;
export { Op, OpIterator, AttributeMap };

/**
 * A model of how real-time collaboration merges rich text: each attribute is
 * an HTML string in a `Y.Text`, every local change is applied as a character
 * diff of the whole string, and concurrent diffs merge as a sequence CRDT
 * would. No `Y.Doc`: two peers' insertions at the same place keep both, in
 * peer order, and a character any peer deleted is gone.
 */

/** One peer's change to a shared string, against the string it started from. */
export interface StringEdit {
	/** Per base character, whether this edit deletes it. */
	deleted: boolean[];
	/** Per gap (before base character `i`, the last one at the end), the text inserted there. */
	inserts: string[];
}

/**
 * Myers' shortest edit script from `a` to `b`, as deletions of characters of
 * `a` and insertions into its gaps. A shortest script is what a character
 * diff produces, and like one it aligns markup in the two strings wherever it
 * can, so a new tag can share characters with an old one.
 *
 * @param a Base string.
 * @param b Changed string.
 * @return The edit.
 */
export function diffStrings( a: string, b: string ): StringEdit {
	return diffTokens( [ ...a ], [ ...b ] );
}

/**
 * The same, with every tag and character reference as one token, so an edit
 * inserts or deletes whole tags and never aligns a character of a new tag
 * with text or with another tag.
 *
 * @param a Base string.
 * @param b Changed string.
 * @return The edit, per character of `a`.
 */
export function diffMarkup( a: string, b: string ): StringEdit {
	const tokens = ( html: string ) =>
		html.match( /<[^>]*>|&[^;\s]+;|[\s\S]/g ) ?? [];
	return diffTokens( tokens( a ), tokens( b ) );
}

function diffTokens( ta: string[], tb: string[] ): StringEdit {
	const offsets: number[] = [ 0 ];
	ta.forEach( ( token, i ) => offsets.push( offsets[ i ] + token.length ) );
	const length = offsets[ ta.length ];
	const deleted = new Array< boolean >( length ).fill( false );
	const inserts = new Array< string >( length + 1 ).fill( '' );
	const n = ta.length;
	const m = tb.length;
	// Common prefix and suffix first: most changes are local.
	let start = 0;
	while ( start < n && start < m && ta[ start ] === tb[ start ] ) {
		start++;
	}
	let end = 0;
	while (
		end < n - start &&
		end < m - start &&
		ta[ n - 1 - end ] === tb[ m - 1 - end ]
	) {
		end++;
	}
	const sa = ta.slice( start, n - end );
	const sb = tb.slice( start, m - end );
	const ops = myers( sa, sb );
	let x = 0;
	for ( const op of ops ) {
		if ( op.type === 'eq' ) {
			x = op.x + 1;
		} else if ( op.type === 'del' ) {
			const token = start + op.x;
			for ( let c = offsets[ token ]; c < offsets[ token + 1 ]; c++ ) {
				deleted[ c ] = true;
			}
			x = op.x + 1;
		} else {
			inserts[ offsets[ start + x ] ] += sb[ op.y ];
		}
	}
	return { deleted, inserts };
}

type Op =
	| { type: 'eq'; x: number; y: number }
	| { type: 'del'; x: number }
	| { type: 'ins'; y: number };

function myers( a: string[], b: string[] ): Op[] {
	const n = a.length;
	const m = b.length;
	const max = n + m;
	const offset = max + 1;
	const v = new Int32Array( 2 * max + 3 );
	const trace: Int32Array[] = [];
	let done = n === 0 && m === 0;
	for ( let d = 0; d <= max && ! done; d++ ) {
		trace.push( v.slice( offset - d - 1, offset + d + 2 ) );
		for ( let k = -d; k <= d; k += 2 ) {
			let x =
				k === -d ||
				( k !== d && v[ offset + k - 1 ] < v[ offset + k + 1 ] )
					? v[ offset + k + 1 ]
					: v[ offset + k - 1 ] + 1;
			let y = x - k;
			while ( x < n && y < m && a[ x ] === b[ y ] ) {
				x++;
				y++;
			}
			v[ offset + k ] = x;
			if ( x >= n && y >= m ) {
				done = true;
				break;
			}
		}
	}
	const ops: Op[] = [];
	let x = n;
	let y = m;
	for ( let d = trace.length - 1; d > 0; d-- ) {
		// The snapshot taken before step d holds diagonals -d-1..d+1.
		const at = ( k: number ) => trace[ d ][ k + d + 1 ];
		const k = x - y;
		const prevK =
			k === -d || ( k !== d && at( k - 1 ) < at( k + 1 ) )
				? k + 1
				: k - 1;
		const prevX = at( prevK );
		const prevY = prevX - prevK;
		while ( x > prevX && y > prevY ) {
			ops.push( { type: 'eq', x: x - 1, y: y - 1 } );
			x--;
			y--;
		}
		if ( x === prevX ) {
			ops.push( { type: 'ins', y: y - 1 } );
		} else {
			ops.push( { type: 'del', x: x - 1 } );
		}
		x = prevX;
		y = prevY;
	}
	while ( x > 0 && y > 0 ) {
		ops.push( { type: 'eq', x: x - 1, y: y - 1 } );
		x--;
		y--;
	}
	return ops.reverse();
}

/**
 * Merge concurrent edits of one base string, in peer order.
 *
 * @param base  Shared string every edit started from.
 * @param edits One edit per peer, `null` for a peer that did not write.
 * @return The merged string, the same on every peer.
 */
export function mergeStrings(
	base: string,
	edits: Array< StringEdit | null >
): string {
	let out = '';
	for ( let gap = 0; gap <= base.length; gap++ ) {
		for ( const edit of edits ) {
			if ( edit ) {
				out += edit.inserts[ gap ];
			}
		}
		if (
			gap < base.length &&
			! edits.some( ( edit ) => edit?.deleted[ gap ] )
		) {
			out += base[ gap ];
		}
	}
	return out;
}

/**
 * Determines if the first path of indices leads to an earlier spot
 * than the second path.
 *
 * @param  pathA
 * @param  pathB
 * @return Negative: A is before B; positive: A is after B; zero: the paths are identical.
 */
export function comparePathAToB( pathA: number[], pathB: number[] ): number {
	let a: number | undefined = 0;
	let b: number | undefined = 0;

	// To avoid modifying the arrays passed into the function.
	const clonedPathA = [ ...pathA ];
	const clonedPathB = [ ...pathB ];

	do {
		a = clonedPathA.shift();
		b = clonedPathB.shift();
	} while ( a === b && a !== undefined && b !== undefined );

	// Defaulting to -1 ensures that if a path terminates before the other, it
	// is considered as leading to an earlier global index. This ensures that
	// parent blocks are considered as coming before their first child.
	// Technically, this isn't needed for the Table of Contents use-case, since
	// neither it nor Page Break blocks support children, but it's good to play
	// it safe in case this code gets reused elsewhere.
	return ( a ?? -1 ) - ( b ?? -1 );
}

export interface HeadingData {
	/** The plain text content of the heading. */
	content: string;
	/** The heading level. */
	level: number;
	/** Link to the heading. */
	link: string;
}

export interface NestedHeadingData {
	/** The heading content, level, and link. */
	heading: HeadingData;
	/** The sub-headings of this heading, if any. */
	children: NestedHeadingData[] | null;
}

/**
 * Takes a flat list of heading parameters and nests them based on each header's
 * immediate parent's level.
 *
 * @param  headingList The flat list of headings to nest.
 *
 * @return The nested list of headings.
 */
export function linearToNestedHeadingList(
	headingList: HeadingData[]
): NestedHeadingData[] {
	const nestedHeadingList: NestedHeadingData[] = [];

	headingList.forEach( ( heading, key ) => {
		if ( heading.content === '' ) {
			return;
		}

		// Make sure we are only working with the same level as the first iteration in our set.
		if ( heading.level === headingList[ 0 ].level ) {
			// Check that the next iteration will return a value.
			// If it does and the next level is greater than the current level,
			// the next iteration becomes a child of the current iteration.
			if ( headingList[ key + 1 ]?.level > heading.level ) {
				// We must calculate the last index before the next iteration that
				// has the same level (siblings). We then use this index to slice
				// the array for use in recursion. This prevents duplicate nodes.
				let endOfSlice = headingList.length;
				for ( let i = key + 1; i < headingList.length; i++ ) {
					if ( headingList[ i ].level === heading.level ) {
						endOfSlice = i;
						break;
					}
				}

				// We found a child node: Push a new node onto the return array
				// with children.
				nestedHeadingList.push( {
					heading,
					children: linearToNestedHeadingList(
						headingList.slice( key + 1, endOfSlice )
					),
				} );
			} else {
				// No child node: Push a new node onto the return array.
				nestedHeadingList.push( {
					heading,
					children: null,
				} );
			}
		}
	} );

	return nestedHeadingList;
}

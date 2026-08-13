/**
 * Text-level helpers for backporting a release's changelog rewrite to another
 * branch without trusting git's three-way merge.
 *
 * The release commit inserts a `## X.Y.Z (date)` heading directly below
 * `## Unreleased`, freezing the unreleased entries into the published version.
 * Replaying that commit textually onto a branch that gained changelog entries
 * in the meantime silently files those unshipped entries under the published
 * version heading. These helpers instead recompute the transform: entries the
 * target branch added since the release base stay under `## Unreleased`, and
 * everything from the new version heading down is taken verbatim from the
 * release commit. See https://github.com/WordPress/gutenberg/issues/81506.
 */

const UNRELEASED_HEADING = '## Unreleased';
const VERSION_HEADING_PATTERN = /^## \d/m;

/**
 * Checks whether a repository path is a package changelog.
 *
 * @param {string} filePath Repository-relative file path.
 *
 * @return {boolean} Whether the path is a package changelog.
 */
function isPackageChangelogPath( filePath ) {
	return /^packages\/[^/]+\/CHANGELOG\.md$/.test( filePath );
}

/**
 * Returns the released portion of a changelog: everything from the first
 * version heading (`## X.Y.Z ...`) to the end of the file.
 *
 * @param {string} content Changelog content.
 *
 * @return {string} The released portion, or an empty string when the
 *                  changelog has no version heading.
 */
function getReleasedChangelogSection( content ) {
	const match = VERSION_HEADING_PATTERN.exec( content );
	return match ? content.slice( match.index ) : '';
}

/**
 * Finds the `## Unreleased` section within changelog lines.
 *
 * @param {string[]} lines    Changelog lines.
 * @param {string}   filePath File path for error messages.
 * @param {string}   label    Which changelog version is being inspected.
 *
 * @return {{ headingIndex: number, endIndex: number }} Indexes of the
 *         `## Unreleased` heading line and of the next `## ` heading (or the
 *         end of the file).
 */
function findUnreleasedSection( lines, filePath, label ) {
	const headingIndex = lines.findIndex(
		( line ) => line.replace( /\s+$/, '' ) === UNRELEASED_HEADING
	);
	if ( headingIndex === -1 ) {
		throw new Error(
			`${ filePath }: the ${ label } changelog has no "${ UNRELEASED_HEADING }" heading.`
		);
	}
	let endIndex = headingIndex + 1;
	while ( endIndex < lines.length && ! /^## /.test( lines[ endIndex ] ) ) {
		endIndex++;
	}
	return { headingIndex, endIndex };
}

/**
 * Parses the lines of an `## Unreleased` section into entry blocks, each
 * annotated with the `###`+ heading path it sits under. An entry block is a
 * top-level list item together with its continuation lines and nested list
 * items.
 *
 * @param {string[]} lines Section lines (excluding the `## Unreleased` line).
 *
 * @return {Array<{ headingPath: string[], lines: string[] }>} Entry blocks.
 */
function parseUnreleasedEntries( lines ) {
	const blocks = [];
	const headingPath = [];
	let currentBlock = null;
	for ( let index = 0; index < lines.length; index++ ) {
		const line = lines[ index ];
		const trimmedLine = line.replace( /\s+$/, '' );
		const headingMatch = /^(#{3,6}) /.exec( trimmedLine );
		if ( headingMatch ) {
			currentBlock = null;
			const depth = headingMatch[ 1 ].length - 3;
			headingPath.length = depth;
			headingPath[ depth ] = trimmedLine;
			continue;
		}
		if ( trimmedLine === '' ) {
			// A blank line continues an entry only when the entry resumes
			// with an indented line, e.g. a nested list after a paragraph.
			let next = index + 1;
			while ( next < lines.length && lines[ next ].trim() === '' ) {
				next++;
			}
			if (
				currentBlock &&
				next < lines.length &&
				/^\s/.test( lines[ next ] )
			) {
				currentBlock.lines.push( line );
			} else {
				currentBlock = null;
			}
			continue;
		}
		if ( /^\s/.test( line ) && currentBlock ) {
			currentBlock.lines.push( line );
			continue;
		}
		if ( /^[-*+] /.test( trimmedLine ) || ! currentBlock ) {
			currentBlock = { headingPath: [ ...headingPath ], lines: [ line ] };
			blocks.push( currentBlock );
		} else {
			// Lazy continuation of the previous entry.
			currentBlock.lines.push( line );
		}
	}
	return blocks;
}

/**
 * Returns a comparison key for an entry block.
 *
 * @param {{ headingPath: string[], lines: string[] }} block Entry block.
 *
 * @return {string} Comparison key.
 */
function getBlockKey( block ) {
	return [
		...block.headingPath,
		'',
		...block.lines.map( ( line ) => line.replace( /\s+$/, '' ) ),
	].join( '\n' );
}

/**
 * Removes from `blocks` one occurrence of every block present in
 * `blocksToRemove`, comparing by heading path and entry text.
 *
 * @param {Array<{ headingPath: string[], lines: string[] }>} blocks         Entry blocks.
 * @param {Array<{ headingPath: string[], lines: string[] }>} blocksToRemove Blocks to remove.
 *
 * @return {Array<{ headingPath: string[], lines: string[] }>} Remaining blocks.
 */
function subtractEntries( blocks, blocksToRemove ) {
	const removalCounts = new Map();
	for ( const block of blocksToRemove ) {
		const key = getBlockKey( block );
		removalCounts.set( key, ( removalCounts.get( key ) ?? 0 ) + 1 );
	}
	return blocks.filter( ( block ) => {
		const key = getBlockKey( block );
		const count = removalCounts.get( key ) ?? 0;
		if ( count === 0 ) {
			return true;
		}
		removalCounts.set( key, count - 1 );
		return false;
	} );
}

/**
 * Serializes entry blocks back into section lines, re-emitting each block's
 * heading path and separating structural elements with single blank lines.
 *
 * @param {Array<{ headingPath: string[], lines: string[] }>} blocks Entry blocks.
 *
 * @return {string[]} Section lines without surrounding blank lines.
 */
function buildUnreleasedSection( blocks ) {
	const lines = [];
	let currentPath = [];
	for ( const block of blocks ) {
		const blockPath = block.headingPath.filter(
			( heading ) => heading !== undefined
		);
		let commonDepth = 0;
		while (
			commonDepth < blockPath.length &&
			commonDepth < currentPath.length &&
			currentPath[ commonDepth ] === blockPath[ commonDepth ]
		) {
			commonDepth++;
		}
		if ( commonDepth < blockPath.length ) {
			for ( const heading of blockPath.slice( commonDepth ) ) {
				if ( lines.length ) {
					lines.push( '' );
				}
				lines.push( heading );
			}
			lines.push( '' );
		} else if ( blockPath.length < currentPath.length ) {
			lines.push( '' );
		}
		lines.push( ...block.lines );
		currentPath = blockPath;
	}
	return lines;
}

/**
 * Recomputes a package changelog for a backport of a release's changelog
 * rewrite.
 *
 * The result keeps the target branch's content above `## Unreleased`, keeps
 * under `## Unreleased` exactly the entries the target branch has that the
 * release base did not (the entries that did not ship), and takes everything
 * from the new version heading down verbatim from the released changelog.
 *
 * @param {Object} input           Input changelog versions.
 * @param {string} input.base      Changelog at the release base (the parent
 *                                 of the changelog commit).
 * @param {string} input.branch    Changelog at the target branch tip.
 * @param {string} input.filePath  File path for error messages.
 * @param {string} input.published Changelog as released (at the changelog
 *                                 commit).
 *
 * @return {string} The recomputed changelog content.
 */
function recomputeBackportedChangelog( { base, branch, filePath, published } ) {
	const baseLines = base.split( '\n' );
	const branchLines = branch.split( '\n' );

	const baseSection = findUnreleasedSection( baseLines, filePath, 'base' );
	const branchSection = findUnreleasedSection(
		branchLines,
		filePath,
		'target branch'
	);

	const normalizeReleased = ( lines ) =>
		lines
			.map( ( line ) => line.replace( /\s+$/, '' ) )
			.join( '\n' )
			.replace( /\s+$/, '' );
	if (
		normalizeReleased( branchLines.slice( branchSection.endIndex ) ) !==
		normalizeReleased( baseLines.slice( baseSection.endIndex ) )
	) {
		throw new Error(
			`${ filePath }: the released changelog sections on the target branch do not match the release base. ` +
				'An entry may have moved into or out of a released section, or an intermediate release was never backported. Resolve the backport manually.'
		);
	}

	const versionHeadingMatch = VERSION_HEADING_PATTERN.exec( published );
	if ( ! versionHeadingMatch ) {
		throw new Error(
			`${ filePath }: the released changelog contains no version heading.`
		);
	}
	const publishedTail = published.slice( versionHeadingMatch.index );

	const unshippedEntries = subtractEntries(
		parseUnreleasedEntries(
			branchLines.slice(
				branchSection.headingIndex + 1,
				branchSection.endIndex
			)
		),
		parseUnreleasedEntries(
			baseLines.slice(
				baseSection.headingIndex + 1,
				baseSection.endIndex
			)
		)
	);
	const unreleasedLines = buildUnreleasedSection( unshippedEntries );

	return [
		...branchLines.slice( 0, branchSection.headingIndex + 1 ),
		'',
		...( unreleasedLines.length ? [ ...unreleasedLines, '' ] : [] ),
		publishedTail,
	].join( '\n' );
}

module.exports = {
	getReleasedChangelogSection,
	isPackageChangelogPath,
	recomputeBackportedChangelog,
};

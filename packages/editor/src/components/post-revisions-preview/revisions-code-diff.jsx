import { diffLines, diffWordsWithSpace } from 'diff';
import clsx from 'clsx';
import { Spinner as WCSpinner } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import { VisuallyHidden } from '@wordpress/ui';
import { store as editorStore } from '../../store';
import { buildRevisionsPageQuery } from '../../store/private-selectors';
import { unlock } from '../../lock-unlock';

const MAX_DIFF_EDIT_LENGTH = 1000;
const DIFF_TIMEOUT = 100;
// Skip intra-line pairing when a block needs more than 2,500 line
// comparisons (50 × 50). Pairing is O(n*m).
const MAX_PAIRING_COMPARISONS = 2500;
// Match the word-diff cutoff used by
// WP_Text_Diff_Renderer_Table::$_diff_threshold in WordPress core.
const INTRA_LINE_DIFF_THRESHOLD = 0.6;

/**
 * Diff parts often end in a newline. Remove the trailing empty item so it is
 * not rendered as another source line.
 *
 * @param {string} value Diff part value.
 * @return {string[]} Lines in the diff part.
 */
function splitLines( value ) {
	const lines = value.split( '\n' );
	if ( lines[ lines.length - 1 ] === '' ) {
		lines.pop();
	}
	return lines;
}

/**
 * Diffs two contents line by line.
 *
 * @param {string} previousContent Previous content.
 * @param {string} currentContent  Current content.
 * @return {Array<Object>} Diff parts, each marked as added, removed or neither.
 */
function getDiffParts( previousContent, currentContent ) {
	const parts = diffLines( previousContent, currentContent, {
		maxEditLength: MAX_DIFF_EDIT_LENGTH,
		timeout: DIFF_TIMEOUT,
	} );

	// Line diffing can be quadratic for unrelated revisions. If it exceeds
	// either limit, mark every old and new line instead.
	if ( ! parts ) {
		return [
			{ value: previousContent, removed: true },
			{ value: currentContent, added: true },
		];
	}
	return parts;
}

/**
 * Counts how often each character appears in a line.
 *
 * @param {string} line Source line.
 * @return {Map<string, number>} Character counts keyed by character.
 */
function getCharFrequency( line ) {
	const frequency = new Map();
	for ( const char of line ) {
		frequency.set( char, ( frequency.get( char ) ?? 0 ) + 1 );
	}
	return frequency;
}

/**
 * Calculates the normalized distance between two character-frequency maps.
 * This follows WP_Text_Diff_Renderer_Table::compute_string_distance() in core.
 *
 * @param {Map<string, number>} removedFrequency Removed line frequencies.
 * @param {Map<string, number>} addedFrequency   Added line frequencies.
 * @param {number}              removedLength    Removed line length.
 * @return {number} Distance per removed-line character.
 */
function getStringDistance( removedFrequency, addedFrequency, removedLength ) {
	let difference = 0;
	for ( const [ char, count ] of removedFrequency ) {
		difference += Math.abs( count - ( addedFrequency.get( char ) ?? 0 ) );
	}
	for ( const [ char, count ] of addedFrequency ) {
		if ( ! removedFrequency.has( char ) ) {
			difference += count;
		}
	}
	return difference / removedLength;
}

/**
 * Greedily matches removed and added lines by string distance. This follows
 * WP_Text_Diff_Renderer_Table::interleave_changed_lines() in core. The matches
 * control word diffing without changing row order.
 *
 * @param {string[]} removedLines Removed lines.
 * @param {string[]} addedLines   Added lines.
 * @return {Array<[number, number]>} Matched [removed, added] index pairs.
 */
function pairChangedLines( removedLines, addedLines ) {
	if ( removedLines.length * addedLines.length > MAX_PAIRING_COMPARISONS ) {
		return [];
	}

	// Skip empty lines: they have no words to highlight and would cause a
	// division by zero.
	const removedCandidates = [];
	removedLines.forEach( ( line, index ) => {
		if ( line.length ) {
			removedCandidates.push( {
				index,
				frequency: getCharFrequency( line ),
			} );
		}
	} );
	const addedCandidates = [];
	addedLines.forEach( ( line, index ) => {
		if ( line.length ) {
			addedCandidates.push( {
				index,
				frequency: getCharFrequency( line ),
			} );
		}
	} );

	const matches = [];
	for ( const removed of removedCandidates ) {
		for ( const added of addedCandidates ) {
			matches.push( {
				removedIndex: removed.index,
				addedIndex: added.index,
				distance: getStringDistance(
					removed.frequency,
					added.frequency,
					removedLines[ removed.index ].length
				),
			} );
		}
	}
	matches.sort(
		( a, b ) =>
			a.distance - b.distance ||
			a.removedIndex - b.removedIndex ||
			a.addedIndex - b.addedIndex
	);

	const usedRemoved = new Set();
	const usedAdded = new Set();
	const pairs = [];
	for ( const { removedIndex, addedIndex } of matches ) {
		if ( usedRemoved.has( removedIndex ) || usedAdded.has( addedIndex ) ) {
			continue;
		}
		usedRemoved.add( removedIndex );
		usedAdded.add( addedIndex );
		pairs.push( [ removedIndex, addedIndex ] );
	}
	return pairs;
}

/**
 * Builds word-level segments for a matched pair. Returns null when the lines
 * are identical, too different, or take too long to compare.
 *
 * @param {string} removedLine Removed line.
 * @param {string} addedLine   Added line.
 * @param {number} timeout     Milliseconds left for this word diff.
 * @return {?{removedSegments: Array<Object>, addedSegments: Array<Object>}} Segments per side.
 */
function getLineSegments( removedLine, addedLine, timeout ) {
	const wordDiff = diffWordsWithSpace( removedLine, addedLine, { timeout } );
	if ( ! wordDiff ) {
		return null;
	}

	let changedChars = 0;
	let commonChars = 0;
	for ( const part of wordDiff ) {
		if ( part.added || part.removed ) {
			changedChars += part.value.length;
		} else {
			commonChars += part.value.length;
		}
	}
	if ( changedChars === 0 ) {
		return null;
	}
	// Shared markup counts as common content. Since this view diffs raw markup
	// without normalizing whitespace, the cutoff is looser than core's prose
	// diff.
	if (
		changedChars / ( 2 * commonChars + changedChars ) >
		INTRA_LINE_DIFF_THRESHOLD
	) {
		return null;
	}

	return {
		removedSegments: wordDiff
			.filter( ( part ) => ! part.added )
			.map( ( part ) =>
				part.removed
					? { value: part.value, removed: true }
					: { value: part.value }
			),
		addedSegments: wordDiff
			.filter( ( part ) => ! part.removed )
			.map( ( part ) =>
				part.added
					? { value: part.value, added: true }
					: { value: part.value }
			),
	};
}

/**
 * Pairs lines and builds word-level segments for each changed block. A changed
 * block is a removed part followed by an added part.
 *
 * @param {Array<Object>} parts Line-diff parts.
 * @return {Map<number, Map<number, Array<Object>>>} Segments keyed by part and line index.
 */
function getIntraLineSegments( parts ) {
	const segmentsByPart = new Map();
	// Share one timeout across the pass so it cannot reset for every line pair.
	const deadline = Date.now() + DIFF_TIMEOUT;

	for ( let i = 0; i < parts.length - 1 && Date.now() < deadline; i++ ) {
		if ( ! parts[ i ].removed || ! parts[ i + 1 ].added ) {
			continue;
		}
		const removedLines = splitLines( parts[ i ].value );
		const addedLines = splitLines( parts[ i + 1 ].value );
		for ( const [ removedIndex, addedIndex ] of pairChangedLines(
			removedLines,
			addedLines
		) ) {
			const remaining = deadline - Date.now();
			if ( remaining <= 0 ) {
				break;
			}
			const segments = getLineSegments(
				removedLines[ removedIndex ],
				addedLines[ addedIndex ],
				remaining
			);
			if ( ! segments ) {
				continue;
			}
			if ( ! segmentsByPart.has( i ) ) {
				segmentsByPart.set( i, new Map() );
			}
			if ( ! segmentsByPart.has( i + 1 ) ) {
				segmentsByPart.set( i + 1, new Map() );
			}
			segmentsByPart
				.get( i )
				.set( removedIndex, segments.removedSegments );
			segmentsByPart
				.get( i + 1 )
				.set( addedIndex, segments.addedSegments );
		}
		// The added part cannot start another block.
		i++;
	}
	return segmentsByPart;
}

/**
 * Creates the rows shown in the code diff and adds line numbers for both
 * revisions. Closely matched changed lines also include word-level segments.
 *
 * @param {string}  previousContent Previous revision content.
 * @param {string}  currentContent  Selected revision content.
 * @param {boolean} showDiff        Whether changes should be highlighted.
 * @return {Array<Object>} Code-diff rows.
 */
export function getCodeDiffRows( previousContent, currentContent, showDiff ) {
	const parts = showDiff
		? getDiffParts( previousContent, currentContent )
		: [ { value: currentContent } ];
	const segmentsByPart = showDiff ? getIntraLineSegments( parts ) : new Map();

	let previousLineNumber = 1;
	let currentLineNumber = 1;

	return parts.flatMap( ( part, partIndex ) => {
		let status = 'unchanged';
		if ( part.added ) {
			status = 'added';
		} else if ( part.removed ) {
			status = 'removed';
		}

		return splitLines( part.value ).map( ( value, lineIndex ) => {
			const row = {
				value,
				status,
				previousLineNumber: null,
				currentLineNumber: null,
			};

			const segments = segmentsByPart.get( partIndex )?.get( lineIndex );
			if ( segments ) {
				row.segments = segments;
			}

			if ( status !== 'added' && showDiff ) {
				row.previousLineNumber = previousLineNumber++;
			}
			if ( status !== 'removed' ) {
				row.currentLineNumber = currentLineNumber++;
			}

			return row;
		} );
	} );
}

/**
 * Creates the rows of a side-by-side code diff. Each row holds a line of the
 * previous content and a line of the current content. Unchanged lines show on
 * both sides; a run of changes pairs its removed and added lines up in order,
 * leaving a side empty where the other has more lines.
 *
 * @param {string} previousContent Previous content.
 * @param {string} currentContent  Current content.
 * @return {Array<{previous: Object|null, current: Object|null}>} Rows.
 */
export function getSplitCodeDiffRows( previousContent, currentContent ) {
	const parts = getDiffParts( previousContent, currentContent );
	const rows = [];
	let previousLineNumber = 1;
	let currentLineNumber = 1;
	let removedLines = [];
	let addedLines = [];

	const flushChanges = () => {
		const length = Math.max( removedLines.length, addedLines.length );
		for ( let index = 0; index < length; index++ ) {
			rows.push( {
				previous:
					index < removedLines.length
						? {
								value: removedLines[ index ],
								status: 'removed',
								lineNumber: previousLineNumber++,
							}
						: null,
				current:
					index < addedLines.length
						? {
								value: addedLines[ index ],
								status: 'added',
								lineNumber: currentLineNumber++,
							}
						: null,
			} );
		}
		removedLines = [];
		addedLines = [];
	};

	for ( const part of parts ) {
		if ( part.removed ) {
			removedLines.push( ...splitLines( part.value ) );
		} else if ( part.added ) {
			addedLines.push( ...splitLines( part.value ) );
		} else {
			flushChanges();
			for ( const value of splitLines( part.value ) ) {
				rows.push( {
					previous: {
						value,
						status: 'unchanged',
						lineNumber: previousLineNumber++,
					},
					current: {
						value,
						status: 'unchanged',
						lineNumber: currentLineNumber++,
					},
				} );
			}
		}
	}
	flushChanges();

	return rows;
}

/**
 * Determines whether the code diff should wait for an older revision or fall
 * back to showing the selected revision without a diff.
 *
 * @param {Object}      options                             Display options.
 * @param {Object|null} options.previousRevision            Previous revision.
 * @param {boolean}     options.showDiff                    Whether changes should be highlighted.
 * @param {boolean}     options.hasOlderRevisionPage        Whether another revisions page exists.
 * @param {boolean}     options.hasFinishedPreviousRevision Whether the previous revision request finished.
 * @return {Object} Code-diff display state.
 */
export function getCodeDiffDisplayState( {
	previousRevision,
	showDiff,
	hasOlderRevisionPage,
	hasFinishedPreviousRevision,
} ) {
	const needsPreviousRevision =
		showDiff && previousRevision === null && hasOlderRevisionPage;

	return {
		showDiff:
			showDiff &&
			! ( needsPreviousRevision && hasFinishedPreviousRevision ),
		isPreviousRevisionLoading:
			needsPreviousRevision && ! hasFinishedPreviousRevision,
	};
}

export default function ConnectedRevisionsCodeDiff() {
	const revisionDiff = useSelect( ( select ) => {
		const editorSelectors = select( editorStore );
		const coreSelectors = select( coreStore );
		const {
			getShownVersion,
			getComparedVersion,
			getRevisionPage,
			getRevisionsPerPage,
			isShowingRevisionDiff,
		} = unlock( editorSelectors );
		const _previousRevision = getComparedVersion();
		const _showDiff = isShowingRevisionDiff();
		const revisionPage = getRevisionPage();
		const totalPages =
			Math.ceil(
				editorSelectors.getCurrentPostRevisionsCount() /
					getRevisionsPerPage()
			) || 1;
		const hasOlderRevisionPage = revisionPage < totalPages;
		let hasFinishedPreviousRevision = true;

		if ( _showDiff && _previousRevision === null && hasOlderRevisionPage ) {
			const postType = editorSelectors.getCurrentPostType();
			const postId = editorSelectors.getCurrentPostId();
			const entityConfig = coreSelectors.getEntityConfig(
				'postType',
				postType
			);
			const revisionKey = entityConfig?.revisionKey || 'id';

			hasFinishedPreviousRevision = coreSelectors.hasFinishedResolution(
				'getRevisions',
				[
					'postType',
					postType,
					postId,
					buildRevisionsPageQuery( revisionKey, revisionPage + 1 ),
				]
			);
		}

		return {
			revision: getShownVersion(),
			previousRevision: _previousRevision,
			...getCodeDiffDisplayState( {
				previousRevision: _previousRevision,
				showDiff: _showDiff,
				hasOlderRevisionPage,
				hasFinishedPreviousRevision,
			} ),
		};
	}, [] );

	return <RevisionsCodeDiff { ...revisionDiff } />;
}

/**
 * Shows the selected revision's raw block markup as a read-only diff.
 *
 * @param {Object}      props                           Component props.
 * @param {Object}      props.revision                  Selected revision.
 * @param {Object|null} props.previousRevision          Previous revision.
 * @param {boolean}     props.showDiff                  Whether to show changes.
 * @param {boolean}     props.isPreviousRevisionLoading Whether the previous revision is loading.
 * @return {React.JSX.Element} The revision code diff.
 */
export function RevisionsCodeDiff( {
	revision,
	previousRevision,
	showDiff,
	isPreviousRevisionLoading,
} ) {
	const rows = useMemo( () => {
		if ( ! revision || isPreviousRevisionLoading ) {
			return [];
		}

		return getCodeDiffRows(
			previousRevision?.content?.raw ?? '',
			revision.content?.raw ?? '',
			showDiff
		);
	}, [ revision, previousRevision, showDiff, isPreviousRevisionLoading ] );

	if ( ! revision || isPreviousRevisionLoading ) {
		return (
			<div className="editor-revisions-canvas__loading">
				<WCSpinner />
			</div>
		);
	}

	return (
		<CodeDiffTable
			rows={ rows }
			showDiff={ showDiff }
			label={ showDiff ? __( 'Code changes' ) : __( 'Revision code' ) }
			emptyMessage={ __( 'This revision is empty.' ) }
		/>
	);
}

/**
 * The scrollable, focusable region both code-diff tables render in, with the
 * message shown instead of a table when there is nothing to list.
 *
 * @param {Object}          props              Component props.
 * @param {string}          [props.className]  Extra class for the region.
 * @param {string}          props.label        Accessible name of the region.
 * @param {boolean}         props.isEmpty      Whether to show the message instead of the table.
 * @param {string}          props.emptyMessage Message shown when there is nothing to list.
 * @param {React.ReactNode} props.children     The table.
 * @return {React.JSX.Element} The code-diff region.
 */
function CodeDiffRegion( {
	className,
	label,
	isEmpty,
	emptyMessage,
	children,
} ) {
	return (
		<div
			className={ clsx( 'editor-revisions-code-diff', className ) }
			role="region"
			aria-label={ label }
			tabIndex={ 0 }
		>
			{ isEmpty ? (
				<p className="editor-revisions-code-diff__empty">
					{ emptyMessage }
				</p>
			) : (
				children
			) }
		</div>
	);
}

/**
 * Renders code-diff rows as a scrollable, read-only table, with both line
 * numbers in one column of code. `SplitCodeDiffTable` shows them side by side.
 *
 * @param {Object}        props              Component props.
 * @param {Array<Object>} props.rows         Rows from `getCodeDiffRows`.
 * @param {boolean}       props.showDiff     Whether rows carry change markers.
 * @param {string}        props.label        Accessible name of the region.
 * @param {string}        props.emptyMessage Message shown when there are no rows.
 * @return {React.JSX.Element} The code-diff table.
 */
export function CodeDiffTable( { rows, showDiff, label, emptyMessage } ) {
	return (
		<CodeDiffRegion
			label={ label }
			isEmpty={ ! rows.length }
			emptyMessage={ emptyMessage }
		>
			<table className="editor-revisions-code-diff__table">
				<VisuallyHidden render={ <caption /> }>
					{ label }
				</VisuallyHidden>
				<VisuallyHidden render={ <thead /> }>
					<tr>
						{ showDiff && <th>{ __( 'Previous line' ) }</th> }
						<th>{ __( 'Current line' ) }</th>
						{ showDiff && <th>{ _x( 'Change', 'noun' ) }</th> }
						<th>{ __( 'Code' ) }</th>
					</tr>
				</VisuallyHidden>
				<tbody>
					{ rows.map( ( row, index ) => {
						let marker = '';
						let statusLabel = __( 'Unchanged' );
						if ( row.status === 'added' ) {
							marker = '+';
							statusLabel = __( 'Added' );
						} else if ( row.status === 'removed' ) {
							marker = '−';
							statusLabel = __( 'Removed' );
						}

						// Keep word-level highlights visual because the row
						// already announces the change.
						const code = row.segments
							? row.segments.map( ( segment, segmentIndex ) =>
									segment.added || segment.removed ? (
										<span
											key={ segmentIndex }
											className={ `editor-revisions-code-diff__segment is-${
												segment.added
													? 'added'
													: 'removed'
											}` }
										>
											{ segment.value }
										</span>
									) : (
										segment.value
									)
								)
							: row.value;

						return (
							<tr
								key={ index }
								className={ `editor-revisions-code-diff__line is-${ row.status }` }
							>
								{ showDiff && (
									<td className="editor-revisions-code-diff__line-number is-previous">
										{ row.previousLineNumber }
									</td>
								) }
								<td className="editor-revisions-code-diff__line-number is-current">
									{ row.currentLineNumber }
								</td>
								{ showDiff && (
									<td className="editor-revisions-code-diff__marker">
										<VisuallyHidden>
											{ statusLabel }
										</VisuallyHidden>
										<span aria-hidden="true">
											{ marker }
										</span>
									</td>
								) }
								<td className="editor-revisions-code-diff__code">
									<code>{ code }</code>
								</td>
							</tr>
						);
					} ) }
				</tbody>
			</table>
		</CodeDiffRegion>
	);
}

/**
 * Renders one side of a side-by-side code-diff row: its line number, change
 * marker and code, or empty cells when the side has no line.
 *
 * @param {Object}      props      Component props.
 * @param {Object|null} props.line The side's line, from `getSplitCodeDiffRows`.
 * @return {React.JSX.Element} The side's cells.
 */
function SplitCodeDiffSide( { line } ) {
	if ( ! line ) {
		return (
			<>
				<td className="editor-revisions-code-diff__line-number is-empty" />
				<td className="editor-revisions-code-diff__marker is-empty" />
				<td className="editor-revisions-code-diff__code is-empty" />
			</>
		);
	}

	let marker = '';
	let statusLabel = __( 'Unchanged' );
	if ( line.status === 'added' ) {
		marker = '+';
		statusLabel = __( 'Added' );
	} else if ( line.status === 'removed' ) {
		marker = '−';
		statusLabel = __( 'Removed' );
	}

	return (
		<>
			<td
				className={ `editor-revisions-code-diff__line-number is-${ line.status }` }
			>
				{ line.lineNumber }
			</td>
			<td
				className={ `editor-revisions-code-diff__marker is-${ line.status }` }
			>
				<VisuallyHidden>{ statusLabel }</VisuallyHidden>
				<span aria-hidden="true">{ marker }</span>
			</td>
			<td
				className={ `editor-revisions-code-diff__code is-${ line.status }` }
			>
				<code>{ line.value }</code>
			</td>
		</>
	);
}

/**
 * Renders side-by-side code-diff rows as a read-only table, the previous
 * content on the start side and the current content on the end side.
 *
 * @param {Object}        props               Component props.
 * @param {Array<Object>} props.rows          Rows from `getSplitCodeDiffRows`.
 * @param {string}        props.label         Accessible name of the region.
 * @param {string}        props.previousLabel Name of the previous content.
 * @param {string}        props.currentLabel  Name of the current content.
 * @param {string}        props.emptyMessage  Message shown when there are no rows.
 * @return {React.JSX.Element} The side-by-side code diff.
 */
export function SplitCodeDiffTable( {
	rows,
	label,
	previousLabel,
	currentLabel,
	emptyMessage,
} ) {
	return (
		<CodeDiffRegion
			className="is-split"
			label={ label }
			isEmpty={ ! rows.length }
			emptyMessage={ emptyMessage }
		>
			<table className="editor-revisions-code-diff__table">
				<VisuallyHidden render={ <caption /> }>
					{ label }
				</VisuallyHidden>
				<colgroup>
					<col className="editor-revisions-code-diff__line-number-column" />
					<col className="editor-revisions-code-diff__marker-column" />
					<col />
					<col className="editor-revisions-code-diff__line-number-column" />
					<col className="editor-revisions-code-diff__marker-column" />
					<col />
				</colgroup>
				<VisuallyHidden render={ <thead /> }>
					<tr>
						<th>{ __( 'Line' ) }</th>
						<th>{ _x( 'Change', 'noun' ) }</th>
						<th>{ previousLabel }</th>
						<th>{ __( 'Line' ) }</th>
						<th>{ _x( 'Change', 'noun' ) }</th>
						<th>{ currentLabel }</th>
					</tr>
				</VisuallyHidden>
				<tbody>
					{ rows.map( ( row, index ) => (
						<tr
							key={ index }
							className="editor-revisions-code-diff__line"
						>
							<SplitCodeDiffSide line={ row.previous } />
							<SplitCodeDiffSide line={ row.current } />
						</tr>
					) ) }
				</tbody>
			</table>
		</CodeDiffRegion>
	);
}

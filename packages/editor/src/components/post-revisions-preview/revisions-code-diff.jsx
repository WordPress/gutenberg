import { diffLines } from 'diff';
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
 * Creates the rows shown in the code diff and adds line numbers for both
 * revisions.
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
	let previousLineNumber = 1;
	let currentLineNumber = 1;

	return parts.flatMap( ( part ) => {
		let status = 'unchanged';
		if ( part.added ) {
			status = 'added';
		} else if ( part.removed ) {
			status = 'removed';
		}

		return splitLines( part.value ).map( ( value ) => {
			const row = {
				value,
				status,
				previousLineNumber: null,
				currentLineNumber: null,
			};

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
									<code>{ row.value }</code>
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

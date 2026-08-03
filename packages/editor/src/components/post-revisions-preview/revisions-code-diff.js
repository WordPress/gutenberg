/**
 * External dependencies
 */
import { diffLines } from 'diff';

/**
 * WordPress dependencies
 */
import { Spinner } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { VisuallyHidden } from '@wordpress/ui';

/**
 * Internal dependencies
 */
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
 * Creates the rows shown in the code diff and adds line numbers for both
 * revisions.
 *
 * @param {string}  previousContent Previous revision content.
 * @param {string}  currentContent  Selected revision content.
 * @param {boolean} showDiff        Whether changes should be highlighted.
 * @return {Array<Object>} Code-diff rows.
 */
export function getCodeDiffRows( previousContent, currentContent, showDiff ) {
	let parts = [ { value: currentContent } ];
	if ( showDiff ) {
		parts = diffLines( previousContent, currentContent, {
			maxEditLength: MAX_DIFF_EDIT_LENGTH,
			timeout: DIFF_TIMEOUT,
		} );

		// Line diffing can be quadratic for unrelated revisions. If it exceeds
		// either limit, mark every old and new line instead.
		if ( ! parts ) {
			parts = [
				{ value: previousContent, removed: true },
				{ value: currentContent, added: true },
			];
		}
	}
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
			getCurrentRevision,
			getPreviousRevision,
			getRevisionPage,
			getRevisionsPerPage,
			isShowingRevisionDiff,
		} = unlock( editorSelectors );
		const _previousRevision = getPreviousRevision();
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
			revision: getCurrentRevision(),
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
				<Spinner />
			</div>
		);
	}

	const label = showDiff ? __( 'Code changes' ) : __( 'Revision code' );

	return (
		<div
			className="editor-revisions-code-diff"
			role="region"
			aria-label={ label }
			tabIndex={ 0 }
		>
			{ rows.length ? (
				<table className="editor-revisions-code-diff__table">
					<VisuallyHidden render={ <caption /> }>
						{ label }
					</VisuallyHidden>
					<VisuallyHidden render={ <thead /> }>
						<tr>
							{ showDiff && <th>{ __( 'Previous line' ) }</th> }
							<th>{ __( 'Current line' ) }</th>
							{ showDiff && <th>{ __( 'Change' ) }</th> }
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
			) : (
				<p className="editor-revisions-code-diff__empty">
					{ __( 'This revision is empty.' ) }
				</p>
			) }
		</div>
	);
}

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

/**
 * @typedef {import('./utils/types').DiffSummary} DiffSummary
 */

/**
 * Summary component showing change counts.
 *
 * @param {Object}      props         - Component props
 * @param {DiffSummary} props.summary - The diff summary counts
 * @return {JSX.Element} The rendered component
 */
export function DiffSummary( { summary } ) {
	const { added, removed, modified } = summary;
	const totalChanges = added + removed + modified;

	if ( totalChanges === 0 ) {
		return (
			<div className="revision-diff-viewer__summary revision-diff-viewer__summary--no-changes">
				{ __( 'No changes between these revisions.' ) }
			</div>
		);
	}

	return (
		<div className="revision-diff-viewer__summary">
			<span className="revision-diff-viewer__summary-total">
				{ sprintf(
					/* translators: %d: total number of changes */
					__( '%d changes' ),
					totalChanges
				) }
			</span>
			<div className="revision-diff-viewer__summary-counts">
				{ added > 0 && (
					<span className="revision-diff-viewer__count revision-diff-viewer__count--added">
						{ sprintf(
							/* translators: %d: number of blocks added */
							__( '+%d added' ),
							added
						) }
					</span>
				) }
				{ removed > 0 && (
					<span className="revision-diff-viewer__count revision-diff-viewer__count--removed">
						{ sprintf(
							/* translators: %d: number of blocks removed */
							__( '-%d removed' ),
							removed
						) }
					</span>
				) }
				{ modified > 0 && (
					<span className="revision-diff-viewer__count revision-diff-viewer__count--modified">
						{ sprintf(
							/* translators: %d: number of blocks modified */
							__( '~%d modified' ),
							modified
						) }
					</span>
				) }
			</div>
		</div>
	);
}

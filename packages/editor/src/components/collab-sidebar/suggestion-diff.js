/**
 * External dependencies
 */
import clsx from 'clsx';
import { diffWords } from 'diff/lib/diff/word';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useMemo } from '@wordpress/element';

/**
 * Renders a word-level diff between original block text and suggested replacement
 * for block notes (`diff` npm package).
 *
 * @param {Object} props
 * @param {string} props.originalText  Plain text of the block in the editor (for comparison).
 * @param {string} props.suggestedText Plain text of the suggested content.
 * @param {string} [props.className]   Optional extra class names.
 */
export default function SuggestionDiff( {
	originalText,
	suggestedText,
	className,
} ) {
	const parts = useMemo(
		() => diffWords( originalText ?? '', suggestedText ?? '' ),
		[ originalText, suggestedText ]
	);

	return (
		<div
			className={ clsx(
				'editor-collab-sidebar-panel__suggestion-diff',
				className
			) }
			aria-label={ __( 'Suggested changes compared to original text' ) }
		>
			<span className="editor-revision-fields-diff__value">
				{ parts.map( ( part, index ) => {
					if ( part.added ) {
						return (
							<ins
								key={ index }
								className="editor-revision-fields-diff__added"
							>
								{ part.value }
							</ins>
						);
					}
					if ( part.removed ) {
						return (
							<del
								key={ index }
								className="editor-revision-fields-diff__removed"
							>
								{ part.value }
							</del>
						);
					}
					return <span key={ index }>{ part.value }</span>;
				} ) }
			</span>
		</div>
	);
}

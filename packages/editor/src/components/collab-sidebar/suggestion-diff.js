/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

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
	return (
		<div
			className={ clsx(
				'editor-collab-sidebar-panel__suggestion-diff',
				className
			) }
			aria-label={ __( 'Suggested changes compared to original text' ) }
		>
			<strong>{ __( 'Replace' ) }</strong>
			<span> &quot;{ originalText }&quot; </span>
			<strong>{ __( 'with' ) }</strong>
			<span> &quot;{ suggestedText.trimEnd() }&quot;</span>
		</div>
	);
}

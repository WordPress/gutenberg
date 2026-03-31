/**
 * External dependencies
 */
import clsx from 'clsx';
import { diffWords } from 'diff/lib/diff/word';

/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { shortcode } from '@wordpress/icons';

/*
 * Renders a word-level diff between original block text and suggested replacement
 * for block notes (`diff` npm package).
 *
 * `isActive` controls whether the "Show as diff" toggle should be visible.
 */
export default function SuggestionDiff( {
	originalText,
	suggestedText,
	className,
	isActive = false,
} ) {
	const [ isDiffView, setIsDiffView ] = useState( false );
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
			<div className="editor-collab-sidebar-panel__suggestion-diff-header">
				<div>
					{ isDiffView ? (
						<strong>{ __( 'Diff:' ) }</strong>
					) : (
						<strong>{ __( 'Replace by:' ) }</strong>
					) }
				</div>
				{ isActive && (
					<Button
						__next40pxDefaultSize
						icon={ shortcode }
						size="compact"
						isPressed={ isDiffView }
						label={ __( 'Show as diff' ) }
						onClick={ () => setIsDiffView( ( value ) => ! value ) }
						showTooltip
						variant="tertiary"
					/>
				) }
			</div>
			{ isDiffView ? (
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
			) : (
				<span> &quot;{ suggestedText.trimEnd() }&quot;</span>
			) }
		</div>
	);
}

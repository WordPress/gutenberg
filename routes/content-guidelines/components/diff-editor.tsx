/**
 * DiffEditor component for Content Guidelines.
 *
 * Shows word-level diffs between original and suggested text.
 * Green highlights for added text, red strikethrough for removed text.
 * Read-only with text cursor.
 */

/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';

/**
 * External dependencies
 */
import { diffWords } from 'diff';

interface DiffEditorProps {
	original: string;
	suggested: string;
}

export default function DiffEditor( { original, suggested }: DiffEditorProps ) {
	const parts = useMemo(
		() => diffWords( original, suggested ),
		[ original, suggested ]
	);

	return (
		<div className="diff-editor" style={ { cursor: 'text' } }>
			{ parts.map( ( part, index ) => {
				if ( part.added ) {
					return (
						<span key={ index } className="diff-added">
							{ part.value }
						</span>
					);
				}
				if ( part.removed ) {
					return (
						<span key={ index } className="diff-removed">
							{ part.value }
						</span>
					);
				}
				return (
					<span key={ index }>{ part.value }</span>
				);
			} ) }
		</div>
	);
}

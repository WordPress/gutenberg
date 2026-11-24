import type { AnimationEvent, CSSProperties } from 'react';
import clsx from 'clsx';
import { useReducedMotion } from '@wordpress/compose';
import { useState } from '@wordpress/element';
import { useBlockAppenderPreview } from './context';

/**
 * The space that opens after a block's last inner block while the + in its
 * row is hovered or focused, outlining where the new block will go. It is
 * not a row of the tree grid, so the arrow keys and screen readers pass over
 * it.
 *
 * @param props          Component props.
 * @param props.clientId The block the + adds to.
 * @param props.level    The nesting level of the block's inner blocks.
 */
export default function ListViewBlockAppenderPreview( {
	clientId,
	level,
}: {
	clientId: string;
	level: number;
} ) {
	const { clientId: previewClientId, isInstant } = useBlockAppenderPreview();
	const isOpen = previewClientId === clientId;
	const reducedMotion = useReducedMotion();
	// Stays rendered after closing until the space has slid shut.
	const [ isRendered, setIsRendered ] = useState( isOpen );

	if ( isOpen && ! isRendered ) {
		setIsRendered( true );
	} else if ( ! isOpen && isRendered && ( isInstant || reducedMotion ) ) {
		setIsRendered( false );
	}

	if ( ! isRendered ) {
		return null;
	}

	return (
		<tr
			className={ clsx( 'block-editor-list-view-block-appender-preview', {
				'is-closing': ! isOpen,
			} ) }
			role="presentation"
			aria-hidden="true"
		>
			{ /* Spans the row's contents, + and Options columns. */ }
			<td colSpan={ 3 }>
				<div
					className="block-editor-list-view-block-appender-preview__space"
					style={
						{
							'--wp-block-editor--list-view-preview-level': level,
						} as CSSProperties
					}
					onAnimationEnd={ ( event: AnimationEvent ) => {
						if (
							! isOpen &&
							event.target === event.currentTarget
						) {
							setIsRendered( false );
						}
					} }
				>
					<div className="block-editor-list-view-block-appender-preview__outline" />
				</div>
			</td>
		</tr>
	);
}

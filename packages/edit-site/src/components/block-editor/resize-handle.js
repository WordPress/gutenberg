/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { LEFT, RIGHT, UP, DOWN } from '@wordpress/keycodes';
import { VisuallyHidden } from '@wordpress/components';

const DELTA_LENGTH = 10; // The length to resize per keydown in pixels.

export default function ResizeHandle( { direction, resizeBy } ) {
	function handleKeyDown( event ) {
		const { keyCode } = event;

		if (
			( direction === 'left' && keyCode === LEFT ) ||
			( direction === 'right' && keyCode === RIGHT )
		) {
			// The canvas is centered horizontally, thus resizing it horizontally
			// needs two times the length.
			resizeBy( DELTA_LENGTH * 2, 0 );
		} else if (
			( direction === 'left' && keyCode === RIGHT ) ||
			( direction === 'right' && keyCode === LEFT )
		) {
			resizeBy( -DELTA_LENGTH * 2, 0 );
		} else if ( direction === 'down' ) {
			if ( keyCode === DOWN ) {
				resizeBy( 0, DELTA_LENGTH );
			} else if ( keyCode === UP ) {
				resizeBy( 0, -DELTA_LENGTH );
			}
		}
	}

	return (
		<>
			<button
				className={ `resizable-editor__drag-handle is-${ direction }` }
				aria-label={ __( 'Drag to resize' ) }
				aria-describedby={ `resizable-editor__resize-help-${ direction }` }
				onKeyDown={ handleKeyDown }
			/>
			<VisuallyHidden
				id={ `resizable-editor__resize-help-${ direction }` }
			>
				{ direction === 'down'
					? __( 'Use up and down arrow keys to resize the canvas.' )
					: __(
							'Use left and right arrow keys to resize the canvas.'
					  ) }
			</VisuallyHidden>
		</>
	);
}

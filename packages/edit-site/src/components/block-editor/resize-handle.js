/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { LEFT, RIGHT } from '@wordpress/keycodes';

export default function ResizeHandle( { direction, resizeWidthBy } ) {
	function handleKeyDown( event ) {
		const { keyCode } = event;

		if (
			( direction === 'left' && keyCode === LEFT ) ||
			( direction === 'right' && keyCode === RIGHT )
		) {
			resizeWidthBy( 20 );
		} else if (
			( direction === 'left' && keyCode === RIGHT ) ||
			( direction === 'right' && keyCode === LEFT )
		) {
			resizeWidthBy( -20 );
		}
	}

	return (
		<div className={ `resizable-editor__drag-handle is-${ direction }` }>
			<button
				className="resizable-editor__drag-handle-button"
				aria-label={ __( 'Drag to resize' ) }
				onKeyDown={ handleKeyDown }
			/>
		</div>
	);
}

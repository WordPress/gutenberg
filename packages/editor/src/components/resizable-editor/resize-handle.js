/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { LEFT, RIGHT } from '@wordpress/keycodes';
import {
	VisuallyHidden,
	Tooltip,
	__unstableMotion as motion,
} from '@wordpress/components';

const DELTA_DISTANCE = 20; // The distance to resize per keydown in pixels.

export default function ResizeHandle( { direction, resizeWidthBy } ) {
	function handleKeyDown( event ) {
		const { keyCode } = event;

		if ( keyCode !== LEFT && keyCode !== RIGHT ) {
			return;
		}
		event.preventDefault();

		if (
			( direction === 'left' && keyCode === LEFT ) ||
			( direction === 'right' && keyCode === RIGHT )
		) {
			resizeWidthBy( DELTA_DISTANCE );
		} else if (
			( direction === 'left' && keyCode === RIGHT ) ||
			( direction === 'right' && keyCode === LEFT )
		) {
			resizeWidthBy( -DELTA_DISTANCE );
		}
	}

	const resizeHandleVariants = {
		active: {
			opacity: 1,
			scaleY: 1.3,
		},
	};

	const resizableHandleHelpId = `resizable-editor__resize-help-${ direction }`;

	return (
		<>
			<Tooltip text={ __( 'Drag to resize' ) }>
				<motion.button
					className={ `editor-resizable-editor__resize-handle is-${ direction }` }
					aria-label={ __( 'Drag to resize' ) }
					aria-describedby={ resizableHandleHelpId }
					onKeyDown={ handleKeyDown }
					variants={ resizeHandleVariants }
					whileFocus="active"
					whileHover="active"
					whileTap="active"
					key="handle"
					role="separator"
					aria-orientation="vertical"
				/>
			</Tooltip>
			<VisuallyHidden id={ resizableHandleHelpId }>
				{ __( 'Use left and right arrow keys to resize the canvas.' ) }
			</VisuallyHidden>
		</>
	);
}

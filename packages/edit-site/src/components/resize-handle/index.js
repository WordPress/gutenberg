/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { LEFT, RIGHT } from '@wordpress/keycodes';
import { VisuallyHidden } from '@wordpress/components';
import { useState, useEffect, useRef } from '@wordpress/element';
import { useRefEffect, useInstanceId, useMergeRefs } from '@wordpress/compose';

const DELTA_DISTANCE = 20; // The distance to resize per keydown in pixels.

export default function ResizeHandle( {
	value,
	onStartResize,
	onEndResize,
	onResize,
	factor,
} ) {
	const [ initialPosition, setInitialPosition ] = useState( null );
	const id = useInstanceId( ResizeHandle );
	const currentValue = useRef( value );
	useEffect( () => {
		if ( initialPosition ) {
			setInitialPosition(
				initialPosition + ( currentValue.current - value )
			);
		}
		currentValue.current = value;
	}, [ value, initialPosition ] );

	function onKeyDown( event ) {
		const { keyCode } = event;

		if ( keyCode === LEFT ) {
			onResize( value + factor * DELTA_DISTANCE );
		} else if ( keyCode === RIGHT ) {
			onResize( value - factor * DELTA_DISTANCE );
		}
	}

	const onMouseDown = ( event ) => {
		event.preventDefault();
		onStartResize();
		setInitialPosition( event.clientX );
	};

	const onMouseResetRef = useRefEffect( ( node ) => {
		const reset = () => {
			onEndResize();
			setInitialPosition( null );
		};
		node.ownerDocument.addEventListener( 'mouseup', reset );
		return () => node.ownerDocument.removeEventListener( 'mouseup', reset );
	}, [] );

	const onMouseMoveRef = useRefEffect(
		( node ) => {
			const resize = ( event ) => {
				if ( initialPosition === null ) {
					return;
				}

				onResize(
					currentValue.current +
						factor * ( event.clientX - initialPosition )
				);
			};
			node.ownerDocument.addEventListener( 'mousemove', resize );
			return () => {
				node.ownerDocument.removeEventListener( 'mousemove', resize );
			};
		},
		[ initialPosition, factor ]
	);

	return (
		<>
			<button
				ref={ useMergeRefs( [ onMouseMoveRef, onMouseResetRef ] ) }
				className="edit-site-resize-handle"
				aria-label={ __( 'Drag to resize' ) }
				aria-describedby={ `resizable-editor__resize-help-${ id }` }
				onKeyDown={ onKeyDown }
				onMouseDown={ onMouseDown }
			/>
			<VisuallyHidden id={ `resizable-editor__resize-help-${ id }` }>
				{ __( 'Use left and right arrow keys to resize the canvas.' ) }
			</VisuallyHidden>
		</>
	);
}

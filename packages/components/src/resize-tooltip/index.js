/**
 * External dependencies
 */
import { noop } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { forwardRef, useCallback, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Label from './label';
import { useResizeLabel, POSITIONS } from './utils';
import { Root } from './styles/resize-tooltip.styles';

function ResizeTooltip(
	{
		axis,
		className,
		fadeTimeout = 180,
		isVisible = true,
		labelRef,
		onMove = noop,
		onResize = noop,
		position = POSITIONS.corner,
		showPx = true,
		zIndex = 1000,
		...props
	},
	ref
) {
	const [ cursorX, setCursorX ] = useState( 0 );
	const [ cursorY, setCursorY ] = useState( 0 );

	const handleOnMove = useCallback(
		( event ) => {
			setCursorX( event.clientX );
			setCursorY( event.clientY );
			onMove( event );
		},
		[ onMove, position ]
	);

	const { isActive, label, resizeListener } = useResizeLabel( {
		axis,
		fadeTimeout,
		onMove: handleOnMove,
		onResize,
		showPx,
		position,
	} );

	if ( ! isVisible ) return null;

	const classes = classnames( 'components-resize-tooltip', className );

	return (
		<Root aria-hidden="true" className={ classes } ref={ ref } { ...props }>
			{ resizeListener }
			<Label
				aria-hidden={ props[ 'aria-hidden' ] }
				cursorX={ cursorX }
				cursorY={ cursorY }
				fadeTimeout={ fadeTimeout }
				isActive={ isActive }
				isVisible={ isVisible }
				label={ label }
				position={ position }
				ref={ labelRef }
				zIndex={ zIndex }
			/>
		</Root>
	);
}

const ForwardedComponent = forwardRef( ResizeTooltip );

export default ForwardedComponent;

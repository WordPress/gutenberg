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
		isEnabled = true,
		fadeTimeout = 180,
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
	const [ tooltipPosition, setTooltipPosition ] = useState( { x: 0, y: 0 } );

	const handleOnMove = useCallback(
		( event ) => {
			setTooltipPosition( { x: event.clientX, y: event.clientY } );
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

	if ( ! isEnabled ) return null;

	const classes = classnames( 'components-resizable-visualizer', className );

	return (
		<Root aria-hidden="true" className={ classes } ref={ ref } { ...props }>
			{ resizeListener }
			<Label
				aria-hidden={ props[ 'aria-hidden' ] }
				cursorPosition={ tooltipPosition }
				fadeTimeout={ fadeTimeout }
				isActive={ isActive }
				isEnabled={ isEnabled }
				label={ label }
				ref={ labelRef }
				position={ position }
				zIndex={ zIndex }
			/>
		</Root>
	);
}

const ForwardedComponent = forwardRef( ResizeTooltip );

export default ForwardedComponent;

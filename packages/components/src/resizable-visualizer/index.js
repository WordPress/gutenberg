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
import { useResizeLabel, VARIANTS } from './utils';
import { Root } from './styles/resizable-visualizer.styles';

function Visualizer(
	{
		className,
		fadeTimeout = 180,
		labelRef,
		onMove = noop,
		onResize = noop,
		showPx = true,
		variant = VARIANTS.cursor,
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
		[ onMove, variant ]
	);

	const { isActive, label, resizeListener } = useResizeLabel( {
		fadeTimeout,
		onMove: handleOnMove,
		onResize,
		showPx,
		variant,
	} );

	const classes = classnames( 'components-resizable-visualizer', className );

	return (
		<Root aria-hidden="true" className={ classes } ref={ ref } { ...props }>
			{ resizeListener }
			<Label
				fadeTimeout={ fadeTimeout }
				isActive={ isActive }
				label={ label }
				ref={ labelRef }
				position={ tooltipPosition }
				variant={ variant }
				zIndex={ zIndex }
			/>
		</Root>
	);
}

const ForwardedComponent = forwardRef( Visualizer );

export default ForwardedComponent;

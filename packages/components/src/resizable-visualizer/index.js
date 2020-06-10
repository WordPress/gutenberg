/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { useCallback, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Label from './label';
import { useResizeLabel, VARIANTS } from './utils';
import { Root } from './styles/resizable-visualizer.styles';

function Visualizer( {
	fadeTimeout = 180,
	onMove = noop,
	onResize = noop,
	showPx = true,
	variant = VARIANTS.cursor,
	zIndex = 1000,
} ) {
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

	return (
		<Root aria-hidden="true">
			{ resizeListener }
			<Label
				fadeTimeout={ fadeTimeout }
				isActive={ isActive }
				label={ label }
				position={ tooltipPosition }
				variant={ variant }
				zIndex={ zIndex }
			/>
		</Root>
	);
}

export default Visualizer;

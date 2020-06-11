/**
 * External dependencies
 */
import { Portal } from 'reakit/Portal';

/**
 * WordPress dependencies
 */
import { Fragment, forwardRef, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { POSITIONS } from './utils';
import { useRTL } from '../utils/style-mixins';
import { TooltipWrapper, Tooltip } from './styles/resize-tooltip.styles';

const CORNER_OFFSET = 4;
const CURSOR_OFFSET_TOP = 12;

function Label(
	{
		cursorPosition = { x: 0, y: 0 },
		fadeTimeout = 180,
		isActive = false,
		label,
		position = POSITIONS.corner,
		zIndex = 1000,
		...props
	},
	ref
) {
	const isRTL = useRTL();
	const tooltipRef = useRef();
	const tooltipWidth = tooltipRef.current?.clientWidth || 0;
	const tooltipHeight = tooltipRef.current?.clientHeight || 0;

	if ( ! label ) {
		return null;
	}

	const showLabel = isActive;

	const isBottom = position === POSITIONS.bottom;
	const isCorner = position === POSITIONS.corner;
	const isCursor = position === POSITIONS.cursor;

	const { x, y } = cursorPosition;

	let style = {
		transitionDelay: ! isActive ? `${ fadeTimeout }ms` : null,
		zIndex,
	};

	if ( isBottom ) {
		style = {
			...style,
			position: 'absolute',
			bottom: ( tooltipHeight + CURSOR_OFFSET_TOP ) * -1,
			left: '50%',
			transform: 'translate(-50%, 0)',
		};
	}

	if ( isCorner ) {
		style = {
			...style,
			position: 'absolute',
			top: CORNER_OFFSET,
			right: isRTL ? null : CORNER_OFFSET,
			left: isRTL ? CORNER_OFFSET : null,
		};
	}

	if ( isCursor ) {
		style = {
			...style,
			position: 'fixed',
			top: 0,
			left: 0,
			right: null,
			transform: `translate(${ x - tooltipWidth / 2 }px, ${
				y - tooltipHeight - CURSOR_OFFSET_TOP
			}px)`,
		};
	}

	/**
	 * For "cursor" POSITIONS, we need to "Portal" the Tooltip to the document
	 * body root for more consistent style rendering.
	 * https://reakit.io/docs/portal/
	 */
	const WrapperComponent = isCursor ? Portal : Fragment;

	return (
		<WrapperComponent>
			<TooltipWrapper
				aria-hidden="true"
				className="components-resizable-visualizer__tooltip-wrapper"
				ref={ tooltipRef }
				isActive={ showLabel }
				style={ style }
				{ ...props }
			>
				<Tooltip
					className="components-resizable-visualizer__tooltip"
					ref={ ref }
				>
					{ label }
				</Tooltip>
			</TooltipWrapper>
		</WrapperComponent>
	);
}

const ForwardedComponent = forwardRef( Label );

export default ForwardedComponent;

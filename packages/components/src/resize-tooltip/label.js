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
import { VARIANTS } from './utils';
import { TooltipWrapper, Tooltip } from './styles/resize-tooltip.styles';

const CURSOR_OFFSET_TOP = 12;

function Label(
	{
		fadeTimeout = 180,
		isActive = false,
		label,
		position = { x: 0, y: 0 },
		variant = VARIANTS.cursor,
		zIndex = 1000,
		...props
	},
	ref
) {
	const tooltipRef = useRef();
	const tooltipWidth = tooltipRef.current?.clientWidth || 0;
	const tooltipHeight = tooltipRef.current?.clientHeight || 0;

	const showLabel = isActive && label;

	const isCorner = variant === VARIANTS.corner;
	const isCursor = variant === VARIANTS.cursor;

	const { x, y } = position;

	let style = {
		transitionDelay: ! isActive ? `${ fadeTimeout }ms` : null,
		zIndex,
	};

	if ( isCorner ) {
		style = {
			...style,
			position: 'absolute',
			top: 4,
			right: 4,
			left: null,
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
	 * For "cursor" variants, we need to "Portal" the Tooltip to the document
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

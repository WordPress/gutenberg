/**
 * External dependencies
 */
import { Portal } from 'reakit/Portal';

/**
 * WordPress dependencies
 */
import { Fragment, forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { POSITIONS } from './utils';
import { useRTL } from '../utils/style-mixins';
import {
	TooltipWrapper,
	Tooltip,
	LabelText,
} from './styles/resize-tooltip.styles';

const CORNER_OFFSET = 4;
const CURSOR_OFFSET_TOP = CORNER_OFFSET * 2.5;

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
	const showLabel = !! label;

	const isBottom = position === POSITIONS.bottom;
	const isCorner = position === POSITIONS.corner;
	const isCursor = position === POSITIONS.cursor;

	const { x, y } = cursorPosition;

	if ( ! showLabel ) return null;

	let style = {
		opacity: showLabel ? 1 : null,
		transitionDelay: ! isActive ? `${ fadeTimeout }ms` : null,
		zIndex,
	};

	let labelStyle = {};

	if ( isBottom ) {
		style = {
			...style,
			position: 'absolute',
			bottom: CURSOR_OFFSET_TOP * -1,
			left: '50%',
			transform: 'translate(-50%, 0)',
		};

		labelStyle = {
			transform: `translate(0, 100%)`,
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
			transform: `translate(${ x }px, ${ y }px)`,
		};

		labelStyle = {
			transform: `translate(-50%, calc(-100% - ${ CURSOR_OFFSET_TOP }px))`,
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
				className="components-resizable-tooltip__tooltip-wrapper"
				isActive={ showLabel }
				ref={ ref }
				style={ style }
				{ ...props }
			>
				<Tooltip
					className="components-resizable-tooltip__tooltip"
					style={ labelStyle }
				>
					<LabelText>{ label }</LabelText>
				</Tooltip>
			</TooltipWrapper>
		</WrapperComponent>
	);
}

const ForwardedComponent = forwardRef( Label );

export default ForwardedComponent;

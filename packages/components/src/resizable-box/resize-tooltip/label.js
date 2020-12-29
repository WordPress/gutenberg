/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';
import { isRTL } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { POSITIONS } from './utils';
import {
	TooltipWrapper,
	Tooltip,
	LabelText,
} from './styles/resize-tooltip.styles';

const CORNER_OFFSET = 4;
const CURSOR_OFFSET_TOP = CORNER_OFFSET * 2.5;

function Label(
	{ label, position = POSITIONS.corner, zIndex = 1000, ...props },
	ref
) {
	const showLabel = !! label;

	const isBottom = position === POSITIONS.bottom;
	const isCorner = position === POSITIONS.corner;

	if ( ! showLabel ) return null;

	let style = {
		opacity: showLabel ? 1 : null,
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
			right: isRTL() ? null : CORNER_OFFSET,
			left: isRTL() ? CORNER_OFFSET : null,
		};
	}

	return (
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
				<LabelText as="span">{ label }</LabelText>
			</Tooltip>
		</TooltipWrapper>
	);
}

const ForwardedComponent = forwardRef( Label );

export default ForwardedComponent;

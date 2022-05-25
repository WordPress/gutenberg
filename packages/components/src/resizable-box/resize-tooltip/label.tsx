/**
 * External dependencies
 */
import type { ForwardedRef } from 'react';

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';
import { isRTL } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Position, POSITIONS } from './utils';
import {
	TooltipWrapper,
	Tooltip,
	LabelText,
} from './styles/resize-tooltip.styles';

const CORNER_OFFSET = 4;
const CURSOR_OFFSET_TOP = CORNER_OFFSET * 2.5;

type LabelProps = React.DetailedHTMLProps<
	React.HTMLAttributes< HTMLDivElement >,
	HTMLDivElement
> & {
	label?: string;
	position: Position;
	zIndex: number;
};

function Label(
	{ label, position = POSITIONS.corner, zIndex = 1000, ...props }: LabelProps,
	ref: ForwardedRef< HTMLDivElement >
): JSX.Element | null {
	const showLabel = !! label;

	const isBottom = position === POSITIONS.bottom;
	const isCorner = position === POSITIONS.corner;

	if ( ! showLabel ) return null;

	let style: React.CSSProperties = {
		opacity: showLabel ? 1 : undefined,
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
			right: isRTL() ? undefined : CORNER_OFFSET,
			left: isRTL() ? CORNER_OFFSET : undefined,
		};
	}

	return (
		<TooltipWrapper
			aria-hidden="true"
			className="components-resizable-tooltip__tooltip-wrapper"
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

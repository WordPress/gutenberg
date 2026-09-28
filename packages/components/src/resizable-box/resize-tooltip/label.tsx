import clsx from 'clsx';
import type { ForwardedRef } from 'react';
import { forwardRef } from '@wordpress/element';
import { isRTL } from '@wordpress/i18n';
import { Text } from '../../text';
import type { Position } from './utils';
import { POSITIONS } from './utils';
import styles from './style.module.scss';

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
) {
	const showLabel = !! label;

	const isBottom = position === POSITIONS.bottom;
	const isCorner = position === POSITIONS.corner;

	if ( ! showLabel ) {
		return null;
	}

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
		<div
			aria-hidden="true"
			className={ clsx(
				'components-resizable-tooltip__tooltip-wrapper',
				styles[ 'tooltip-wrapper' ]
			) }
			ref={ ref }
			style={ style }
			{ ...props }
		>
			<div
				className={ clsx(
					'components-resizable-tooltip__tooltip',
					styles.tooltip
				) }
				style={ labelStyle }
			>
				<Text as="span" className={ styles[ 'label-text' ] }>
					{ label }
				</Text>
			</div>
		</div>
	);
}

const ForwardedComponent = forwardRef( Label );

export default ForwardedComponent;

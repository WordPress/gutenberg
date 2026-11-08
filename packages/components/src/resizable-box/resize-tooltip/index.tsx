import clsx from 'clsx';
import type { ElementType, Ref, ForwardedRef } from 'react';
import { forwardRef } from '@wordpress/element';
import { PolymorphicElement } from '../../utils/polymorphic-element';
import Label from './label';
import type { Axis, Position } from './utils';
import { useResizeLabel, POSITIONS } from './utils';
import styles from './style.module.scss';

type ResizeTooltipProps = React.ComponentPropsWithoutRef< 'div' > & {
	as?: ElementType;
	'aria-hidden'?: boolean;
	axis?: Axis;
	className?: string;
	fadeTimeout?: number;
	isVisible?: boolean;
	labelRef?: Ref< HTMLDivElement >;
	onResize?: Parameters< typeof useResizeLabel >[ 0 ][ 'onResize' ];
	position?: Position;
	showPx?: boolean;
	zIndex?: number;
};

const noop = () => {};

function ResizeTooltip(
	{
		as = 'div',
		axis,
		className,
		fadeTimeout = 180,
		isVisible = true,
		labelRef,
		onResize = noop,
		position = POSITIONS.bottom,
		showPx = true,
		zIndex = 1000,
		...props
	}: ResizeTooltipProps,
	ref: ForwardedRef< HTMLElement >
) {
	const { label, resizeListener } = useResizeLabel( {
		axis,
		fadeTimeout,
		onResize,
		showPx,
		position,
	} );

	if ( ! isVisible ) {
		return null;
	}

	const classes = clsx( 'components-resize-tooltip', styles.root, className );

	return (
		<PolymorphicElement
			aria-hidden="true"
			as={ as }
			{ ...props }
			className={ classes }
			ref={ ref }
		>
			{ resizeListener }
			<Label
				aria-hidden={ props[ 'aria-hidden' ] }
				label={ label }
				position={ position }
				ref={ labelRef }
				zIndex={ zIndex }
			/>
		</PolymorphicElement>
	);
}

const ForwardedComponent = forwardRef( ResizeTooltip );

export default ForwardedComponent;

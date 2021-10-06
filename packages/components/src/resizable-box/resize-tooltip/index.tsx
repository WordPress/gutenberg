/**
 * External dependencies
 */
import { noop } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';
// eslint-disable-next-line no-restricted-imports
import type { Ref } from 'react';

/**
 * Internal dependencies
 */
import Label from './label';
import { useResizeLabel, Axis, Position, POSITIONS } from './utils';
import { Root } from './styles/resize-tooltip.styles';

type ResizeTooltipProps = React.ComponentProps< typeof Root > & {
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

function ResizeTooltip(
	{
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
	ref: Ref< HTMLDivElement >
): JSX.Element | null {
	const { label, resizeListener } = useResizeLabel( {
		axis,
		fadeTimeout,
		onResize,
		showPx,
		position,
	} );

	if ( ! isVisible ) return null;

	const classes = classnames( 'components-resize-tooltip', className );

	return (
		<Root aria-hidden="true" className={ classes } ref={ ref } { ...props }>
			{ resizeListener }
			<Label
				aria-hidden={ props[ 'aria-hidden' ] }
				label={ label }
				position={ position }
				ref={ labelRef }
				zIndex={ zIndex }
			/>
		</Root>
	);
}

const ForwardedComponent = forwardRef( ResizeTooltip );

export default ForwardedComponent;

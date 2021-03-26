/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Flex as BaseFlex } from './styles/flex-styles';
import { withNextFlex } from './next';

export { default as FlexBlock } from './block';
export { default as FlexItem } from './item';

/* eslint-disable jsdoc/valid-types */
/**
 * @typedef OwnProps
 * @property {import('react').CSSProperties['alignItems'] | 'top' | 'bottom'} [align='center'] Sets align-items. Top and bottom are shorthand for flex-start and flex-end respectively.
 * @property {number} [gap=2] Determines the spacing in between children components. The `gap` value is a multiplier to the base value of `4`.
 * @property {import('react').CSSProperties['justifyContent'] | 'left' | 'right'} [justify='space-between']          * Sets jusifty-content. Left and right are shorthand for flex-start and flex-end respectively, not the actual CSS value.
 * @property {boolean} [isReversed=false] Reversed the flex direction.
 * @property {import('react').CSSProperties['flexDirection'] | 'row' | 'column'} [direction='row'] Sets the flex-direction property.
 */
/* eslint-enable jsdoc/valid-types */

/** @typedef {OwnProps & import('react').HTMLProps<HTMLDivElement> & import('react').RefAttributes<HTMLDivElement>} Props */

/**
 * @param {Props} props
 * @param {import('react').Ref<HTMLDivElement>} ref
 */
function FlexComponent(
	{
		align = 'center',
		className,
		gap = 2,
		justify = 'space-between',
		isReversed = false,
		direction = 'row',
		...props
	},
	ref
) {
	const classes = classnames( 'components-flex', className );

	const reversed = isReversed || direction.includes( '-reverse' );
	const simplifiedDirection = direction.includes( '-reverse' )
		? direction.slice( 0, -8 )
		: direction;

	return (
		<BaseFlex
			{ ...props }
			align={ align }
			className={ classes }
			ref={ ref }
			gap={ gap }
			justify={ justify }
			isReversed={ reversed }
			// @ts-ignore
			direction={ simplifiedDirection }
		/>
	);
}

export const Flex = withNextFlex( forwardRef( FlexComponent ) );

export default Flex;

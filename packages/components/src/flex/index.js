/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';
import deprecated from '@wordpress/deprecated';

/**
 * Internal dependencies
 */
import { Flex as BaseFlex } from './styles/flex-styles';
import { withNextFlex } from './next';

export { default as FlexBlock } from './block';
export { default as FlexItem } from './item';

/* eslint-disable jsdoc/valid-types */
/**
 * @typedef {import('react').CSSProperties['flexDirection'] | 'row' | 'column' | 'row-reverse' | 'column-reverse'} FlexDirection
 * @typedef OwnProps
 * @property {import('react').CSSProperties['alignItems'] | 'top' | 'bottom'} [align='center'] Sets align-items. Top and bottom are shorthand for flex-start and flex-end respectively.
 * @property {number} [gap=2] Determines the spacing in between children components. The `gap` value is a multiplier to the base value of `4`.
 * @property {import('react').CSSProperties['justifyContent'] | 'left' | 'right'} [justify='space-between']          * Sets jusifty-content. Left and right are shorthand for flex-start and flex-end respectively, not the actual CSS value.
 * @property {boolean} [isReversed=false] Reversed the flex direction.
 * @property {FlexDirection} [direction='row'] Sets the flex-direction property.
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
		isReversed,
		direction: directionProp,
		...otherProps
	},
	ref
) {
	const direction = useDirection( { isReversed, direction: directionProp } );

	const classes = classnames( 'components-flex', className );

	return (
		<BaseFlex
			{ ...otherProps }
			align={ align }
			className={ classes }
			ref={ ref }
			gap={ gap }
			justify={ justify }
			direction={ direction }
		/>
	);
}

/**
 * @param {Props} props
 */
function useDirection( { isReversed, direction = 'row' } ) {
	if ( typeof isReversed !== 'undefined' ) {
		deprecated( 'Flex isReversed', {
			alternative: 'Flex direction="row-reverse"',
		} );
		if ( isReversed ) {
			return 'row-reverse';
		}
		return 'row';
	}

	return direction;
}

export const Flex = withNextFlex( forwardRef( FlexComponent ) );

export default Flex;

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

export { default as FlexBlock } from './block';
export { default as FlexItem } from './item';

function FlexComponent(
	{
		align = 'center',
		className,
		gap = 2,
		justify = 'space-between',
		isReversed = false,
		...props
	},
	ref
) {
	const classes = classnames( 'components-flex', className );

	return (
		<BaseFlex
			{ ...props }
			align={ align }
			className={ classes }
			ref={ ref }
			gap={ gap }
			justify={ justify }
			isReversed={ isReversed }
		/>
	);
}

export const Flex = forwardRef( FlexComponent );

export default Flex;

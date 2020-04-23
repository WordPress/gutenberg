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
import Block from './block';
import Item from './item';

function Flex(
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

const ForwardedComponent = forwardRef( Flex );
ForwardedComponent.Block = Block;
ForwardedComponent.Item = Item;

export default ForwardedComponent;

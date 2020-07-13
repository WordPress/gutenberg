/**
 * Internal dependencies
 */
/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';
import { getValidChildren } from '../utils';
import Flex from '../flex';
import { ControlGroupContext } from './utils';

export { useControlGroupContext } from './utils';

function ControlGroup( { children, ...props }, ref ) {
	const validChildren = getValidChildren( children );

	const clonedChildren = validChildren.map( ( child, index ) => {
		const isFirst = index === 0;
		const isLast = index + 1 === validChildren.length;
		const isOnly = isFirst && isLast;
		const isMiddle = ! isFirst && ! isLast;

		const _key = child.key || index;
		const contextValue = {
			isFirst,
			isLast,
			isMiddle,
			isOnly,
		};

		return (
			<ControlGroupContext.Provider key={ _key } value={ contextValue }>
				{ child }
			</ControlGroupContext.Provider>
		);
	} );

	return (
		<Flex { ...props } gap={ 0 } justify="flex-start" ref={ ref }>
			{ clonedChildren }
		</Flex>
	);
}

const ForwardedComponent = forwardRef( ControlGroup );

export default ForwardedComponent;

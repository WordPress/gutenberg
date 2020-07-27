/**
 * Internal dependencies
 */
import { getValidChildren } from '../utils';

import { Flex } from '../flex';
import { ControlGroupContext } from './utils';

export { controlGroupStyles } from './styles/control-group-styles';
export { ControlGroupContext, useControlGroupContext } from './utils';
export { default as ControlGroupItem } from './item';

export function ControlGroup( { children, ...props } ) {
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
		<Flex gap={ 0 } role="group" { ...props }>
			{ clonedChildren }
		</Flex>
	);
}

export default ControlGroup;

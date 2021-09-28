/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Edit from './edit';
import { BlockEditContextProvider, useBlockEditContext } from './context';

export { useBlockEditContext };

export default function BlockEdit( props ) {
	const { name, isSelected, clientId } = props;
	const context = {
		name,
		isSelected,
		clientId,
	};
	return (
		<BlockEditContextProvider
			// It is important to return the same object if props haven't
			// changed to avoid  unnecessary rerenders.
			// See https://reactjs.org/docs/context.html#caveats.
			value={ useMemo( () => context, Object.values( context ) ) }
		>
			<Edit { ...props } />
		</BlockEditContextProvider>
	);
}

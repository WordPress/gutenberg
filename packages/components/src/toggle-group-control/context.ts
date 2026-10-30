import { createContext, useContext } from '@wordpress/element';
import type { ToggleGroupControlContextProps } from './types';

const ToggleGroupControlContext = createContext<
	ToggleGroupControlContextProps | undefined
>( undefined );
ToggleGroupControlContext.displayName = 'ToggleGroupControlContext';

export const useToggleGroupControlContext = (
	componentName = 'ToggleGroupControlOptionBase'
) => {
	const context = useContext( ToggleGroupControlContext );
	if ( ! context ) {
		throw new Error(
			`${ componentName } can only be rendered inside ToggleGroupControl.`
		);
	}
	return context;
};
export default ToggleGroupControlContext;

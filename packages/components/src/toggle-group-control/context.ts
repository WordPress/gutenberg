import { createContext, useContext } from '@wordpress/element';
import type { ToggleGroupControlContextProps } from './types';

const ToggleGroupControlContext = createContext(
	{} as ToggleGroupControlContextProps
);
ToggleGroupControlContext.displayName = 'ToggleGroupControlContext';

export const useToggleGroupControlContext = () =>
	useContext( ToggleGroupControlContext );
export default ToggleGroupControlContext;

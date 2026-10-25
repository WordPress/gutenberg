import { Tooltip as _Tooltip } from '@base-ui/react/tooltip';
import type { ProviderProps } from './types';

function Provider( { ...props }: ProviderProps ) {
	return <_Tooltip.Provider { ...props } />;
}

export { Provider };

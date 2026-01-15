import { Tooltip } from '@base-ui/react/tooltip';
import type { ProviderProps } from './types';

function Provider( { children, ...props }: ProviderProps ) {
	return <Tooltip.Provider { ...props }>{ children }</Tooltip.Provider>;
}

export { Provider };

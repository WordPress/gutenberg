/**
 * External dependencies
 */
import { Tooltip } from '@base-ui/react/tooltip';

/**
 * Internal dependencies
 */
import type { ProviderProps } from './types';

function Provider( { children, ...props }: ProviderProps ) {
	return <Tooltip.Provider { ...props }>{ children }</Tooltip.Provider>;
}

export { Provider };

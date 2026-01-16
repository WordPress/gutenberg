import { Tooltip } from '@base-ui/react/tooltip';
import type { RootProps } from './types';

function Root( props: RootProps ) {
	return <Tooltip.Root { ...props } />;
}

export { Root };

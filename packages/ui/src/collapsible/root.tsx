import { Collapsible } from '@base-ui/react/collapsible';
import type { RootProps } from './types';

function Root( props: RootProps ) {
	return <Collapsible.Root { ...props } />;
}

export { Root };

import { DirectionProvider as _DirectionProvider } from '@base-ui/react/direction-provider';
import type { DirectionProviderProps } from './types';

/**
 * Provides text direction context for `@wordpress/ui` components.
 *
 * Use `DirectionProvider` when rendering a subtree in a direction that differs
 * from the document direction, such as previewing components in right-to-left
 * mode inside Storybook.
 */
function DirectionProvider( props: DirectionProviderProps ) {
	return <_DirectionProvider { ...props } />;
}

export { DirectionProvider };

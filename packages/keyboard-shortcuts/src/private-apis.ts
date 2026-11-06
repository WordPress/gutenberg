import { context as ShortcutContext } from './context';
import { lock } from './lock-unlock';

export const privateApis = {};
lock( privateApis, {
	/**
	 * The context `useShortcut` adds its callbacks to. A provider can wrap
	 * the default one, for example to ignore a part of the page's shortcuts
	 * while that part is hidden.
	 */
	ShortcutContext,
} );

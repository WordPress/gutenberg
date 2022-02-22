/**
 * Internal dependencies
 */
import { Context, OmitNevers } from './helpers';

import { CoreBaseEntityTypes as _CoreBaseEntityTypes } from './wp-base-types';

declare module './wp-base-types' {
	export namespace CoreBaseEntityTypes {
		export interface MenuLocation< C extends Context > {
			/**
			 * The name of the menu location.
			 */
			name: string;
			/**
			 * The description of the menu location.
			 */
			description: string;
			/**
			 * The ID of the assigned menu.
			 */
			menu: number;
		}
	}
}

export type MenuLocation< C extends Context > = OmitNevers<
	_CoreBaseEntityTypes.MenuLocation< C >
>;

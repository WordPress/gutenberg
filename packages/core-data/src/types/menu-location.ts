/**
 * Internal dependencies
 */
import { Context, OmitNevers } from './helpers';

import { WPBaseTypes as _WPBaseTypes } from './wp-base-types';

declare module './wp-base-types' {
	export namespace WPBaseTypes {
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
	_WPBaseTypes.MenuLocation< C >
>;

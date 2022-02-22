/**
 * Internal dependencies
 */
import { Context, OmitNevers } from './helpers';

import { BaseTypes as _BaseTypes } from './base-types';

declare module './base-types' {
	export namespace BaseTypes {
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
	_BaseTypes.MenuLocation< C >
>;

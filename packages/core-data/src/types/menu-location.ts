/**
 * Internal dependencies
 */
import { Context, OmitNevers } from './helpers';

import { BaseEntityTypes as _BaseEntityTypes } from './base-entity-types';

declare module './base-entity-types' {
	export namespace BaseEntityTypes {
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
	_BaseEntityTypes.MenuLocation< C >
>;

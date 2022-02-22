/**
 * Internal dependencies
 */
import { Context, OmitNevers } from './helpers';

import { BaseEntityTypes as _BaseEntityTypes } from './base-entity-types';

declare module './base-entity-types' {
	export namespace BaseEntityTypes {
		export interface NavigationArea< C extends Context > {
			/**
			 * The name of the navigation area.
			 */
			name: string;
			/**
			 * The description of the navigation area.
			 */
			description: string;
			/**
			 * The ID of the assigned navigation.
			 */
			navigation: number;
		}
	}
}

export type NavigationArea< C extends Context > = OmitNevers<
	_BaseEntityTypes.NavigationArea< C >
>;

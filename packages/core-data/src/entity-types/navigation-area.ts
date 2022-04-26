/**
 * Internal dependencies
 */
import type { Context, OmitNevers } from './helpers';

import type { BaseEntityRecords as _BaseEntityRecords } from './base-entity-records';

declare module './base-entity-records' {
	export namespace BaseEntityRecords {
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
	_BaseEntityRecords.NavigationArea< C >
>;

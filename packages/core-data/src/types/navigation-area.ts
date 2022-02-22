/**
 * Internal dependencies
 */
import { Context, OmitNevers } from './helpers';

import { CoreBaseEntityTypes as _CoreBaseEntityTypes } from './wp-base-types';

declare module './wp-base-types' {
	export namespace CoreBaseEntityTypes {
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
	_CoreBaseEntityTypes.NavigationArea< C >
>;

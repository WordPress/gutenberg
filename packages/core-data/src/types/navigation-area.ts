/**
 * Internal dependencies
 */
import { Context, OmitNevers } from './helpers';

import { BaseTypes as _BaseTypes } from './base-types';

declare module './base-types' {
	export namespace BaseTypes {
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
	_BaseTypes.NavigationArea< C >
>;

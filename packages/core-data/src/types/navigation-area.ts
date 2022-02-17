/**
 * Internal dependencies
 */
import { Context, OmitNevers } from './common';

interface FullNavigationArea< C extends Context > {
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

export type NavigationArea< C extends Context > = OmitNevers<
	FullNavigationArea< C >
>;

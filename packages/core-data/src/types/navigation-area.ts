/**
 * Internal dependencies
 */
import { Context } from './helpers';

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

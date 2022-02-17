/**
 * Internal dependencies
 */
import { Context, WithoutNevers } from './common';

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

export type NavigationArea< C extends Context > = WithoutNevers<
	FullNavigationArea< C >
>;

export interface UpdatableNavigationArea extends FullNavigationArea< 'edit' > {}

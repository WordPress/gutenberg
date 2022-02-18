/**
 * Internal dependencies
 */
import { Context } from './helpers';

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

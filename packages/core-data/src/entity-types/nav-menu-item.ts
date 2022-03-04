/**
 * Internal dependencies
 */
import type {
	RenderedText,
	Context,
	ContextualField,
	OmitNevers,
} from './helpers';

import type { BaseEntityRecords as _BaseEntityRecords } from './base-entity-records';
import { DefaultContextByKN } from './entities';

export type NavMenuItemType =
	| 'taxonomy'
	| 'post_type'
	| 'post_type_archive'
	| 'custom';
export type NavMenuItemStatus =
	| 'publish'
	| 'future'
	| 'draft'
	| 'pending'
	| 'private';
export type Target = '_blank' | '';

declare module './base-entity-records' {
	export namespace BaseEntityRecords {
		export interface NavMenuItem< C extends Context > {
			/**
			 * The title for the object.
			 */
			title: RenderedText< C >;
			/**
			 * Unique identifier for the object.
			 */
			id: number;
			/**
			 * The singular label used to describe this type of menu item.
			 */
			type_label: string;
			/**
			 * The family of objects originally represented, such as "post_type" or "taxonomy".
			 */
			type: NavMenuItemType;
			/**
			 * A named status for the object.
			 */
			status: NavMenuItemStatus;
			/**
			 * The ID for the parent of the object.
			 */
			parent: number;
			/**
			 * Text for the title attribute of the link element for this menu item.
			 */
			attr_title: string;
			/**
			 * Class names for the link element of this menu item.
			 */
			classes: string[];
			/**
			 * The description of this menu item.
			 */
			description: string;
			/**
			 * The DB ID of the nav_menu_item that is this item's menu parent, if any, otherwise 0.
			 */
			menu_order: number;
			/**
			 * The type of object originally represented, such as "category", "post", or "attachment".
			 */
			object: string;
			/**
			 * The database ID of the original object this menu item represents, for example the ID for posts or the term_id for categories.
			 */
			object_id: number;
			/**
			 * The target attribute of the link element for this menu item.
			 */
			target: Target;
			/**
			 * The URL to which this menu item points.
			 */
			url: string;
			/**
			 * The XFN relationship expressed in the link of this menu item.
			 */
			xfn: string[];
			/**
			 * Whether the menu item represents an object that no longer exists.
			 */
			invalid: boolean;
			/**
			 * The terms assigned to the object in the nav_menu taxonomy.
			 */
			menus: ContextualField< number, 'view' | 'edit', C >;
			/**
			 * Meta fields.
			 */
			meta: ContextualField<
				Record< string, string >,
				'view' | 'edit',
				C
			>;
		}
	}
}

export type NavMenuItem<
	C extends Context = DefaultContextByKN< 'root', 'menuItem' >
> = OmitNevers< _BaseEntityRecords.NavMenuItem< C > >;

/**
 * Internal dependencies
 */
import type { Context, OmitNevers } from './helpers';

import type { BaseEntityRecords as _BaseEntityRecords } from './base-entity-records';

declare module './base-entity-records' {
	export namespace BaseEntityRecords {
		export interface Sidebar< C extends Context > {
			/**
			 * ID of sidebar.
			 */
			id: string;
			/**
			 * Unique name identifying the sidebar.
			 */
			name: string;
			/**
			 * Description of sidebar.
			 */
			description: string;
			/**
			 * Extra CSS class to assign to the sidebar in the Widgets interface.
			 */
			class: string;
			/**
			 * HTML content to prepend to each widget's HTML output when assigned to this sidebar. Default is an opening list item element.
			 */
			before_widget: string;
			/**
			 * HTML content to append to each widget's HTML output when assigned to this sidebar. Default is a closing list item element.
			 */
			after_widget: string;
			/**
			 * HTML content to prepend to the sidebar title when displayed. Default is an opening h2 element.
			 */
			before_title: string;
			/**
			 * HTML content to append to the sidebar title when displayed. Default is a closing h2 element.
			 */
			after_title: string;
			/**
			 * Status of sidebar.
			 */
			status: SidebarStatus;
			/**
			 * Nested widgets.
			 */
			widgets: ( BaseEntityRecords.Widget< C > | string )[];
		}
	}
}

type SidebarStatus = 'active' | 'inactive';

export type Sidebar< C extends Context > = OmitNevers<
	_BaseEntityRecords.Sidebar< C >
>;

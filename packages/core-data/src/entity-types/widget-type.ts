/**
 * Internal dependencies
 */
import type { Context, OmitNevers } from './helpers';

import type { BaseEntityRecords as _BaseEntityRecords } from './base-entity-records';

declare module './base-entity-records' {
	export namespace BaseEntityRecords {
		/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
		export interface WidgetType< C extends Context > {
			/**
			 * Unique slug identifying the widget type.
			 */
			id: string;
			/**
			 * Human-readable name identifying the widget type.
			 */
			name: string;
			/**
			 * Description of the widget.
			 */
			description: string;
			/**
			 * Whether the widget supports multiple instances
			 */
			is_multi: boolean;
			/**
			 * Class name
			 */
			classname: string;
		}
	}
}

export type WidgetType< C extends Context = 'edit' > = OmitNevers<
	_BaseEntityRecords.WidgetType< C >
>;

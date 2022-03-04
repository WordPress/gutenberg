/**
 * Internal dependencies
 */
import type { Context, OmitNevers } from './helpers';

import type { BaseEntityRecords as _BaseEntityRecords } from './base-entity-records';
import type { DefaultContextOf } from './entities';

declare module './base-entity-records' {
	export namespace BaseEntityRecords {
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

export type WidgetType<
	C extends Context = DefaultContextOf< 'root', 'widgetType' >
> = OmitNevers< _BaseEntityRecords.WidgetType< C > >;

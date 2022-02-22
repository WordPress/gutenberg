/**
 * Internal dependencies
 */
import { Context, OmitNevers } from './helpers';

import { BaseTypes as _BaseTypes } from './base-types';

declare module './base-types' {
	export namespace BaseTypes {
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

export type WidgetType< C extends Context > = OmitNevers<
	_BaseTypes.WidgetType< C >
>;

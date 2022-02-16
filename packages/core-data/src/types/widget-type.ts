/**
 * Internal dependencies
 */
import { Context, WithoutNevers } from './common';

interface FullWidgetType< C extends Context > {
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

export type WidgetType< C extends Context > = WithoutNevers<
	FullWidgetType< C >
>;
export interface EditedWidgetType extends WidgetType< 'edit' > {}

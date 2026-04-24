/**
 * Internal dependencies
 */
import type { WidgetInstance, WidgetType } from './types';

const DEFAULT_WIDTH = 1;
const DEFAULT_HEIGHT = 2;
const DEFAULT_ORDER = 0;

/**
 * Create a new widget instance from a widget type.
 *
 * Generates a unique id and applies layout defaults. If no initial
 * attributes are provided, falls back to the type's `example`.
 * @param widgetType
 * @param initialAttributes
 */
export function createWidgetInstance< T >(
	widgetType: WidgetType,
	initialAttributes?: T
): WidgetInstance< T > {
	return {
		uid: crypto.randomUUID(),
		type: widgetType.name,
		attributes: initialAttributes ?? ( widgetType.example as T ),
		width: DEFAULT_WIDTH,
		height: DEFAULT_HEIGHT,
		order: DEFAULT_ORDER,
	};
}

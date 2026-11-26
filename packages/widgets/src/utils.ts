import type { WidgetBlock } from './types';

/**
 * Get the internal widget id from block.
 *
 * @param block The block.
 * @return The internal widget id.
 */
export function getWidgetIdFromBlock( block: WidgetBlock ): string | undefined {
	return block.attributes.__internalWidgetId;
}

/**
 * Add internal widget id to block's attributes.
 *
 * @param block    The block.
 * @param widgetId The widget id.
 * @return The updated block.
 */
export function addWidgetIdToBlock< T extends Partial< WidgetBlock > >(
	block: T,
	widgetId: string
): T & WidgetBlock {
	return {
		...block,
		attributes: {
			...( block.attributes || {} ),
			__internalWidgetId: widgetId,
		},
	};
}

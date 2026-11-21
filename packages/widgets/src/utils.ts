interface WidgetIdAttributes {
	__internalWidgetId?: string;
	[ key: string ]: unknown;
}

interface BlockWithWidgetIdAttributes {
	attributes?: WidgetIdAttributes;
	[ key: string ]: unknown;
}

/**
 * Get the internal widget id from block.
 *
 * @param block The block.
 * @return The internal widget id.
 */
export function getWidgetIdFromBlock(
	block: BlockWithWidgetIdAttributes
): string | undefined {
	return block.attributes?.__internalWidgetId;
}

/**
 * Add internal widget id to block's attributes.
 *
 * @param block    The block.
 * @param widgetId The widget id.
 * @return The updated block.
 */
export function addWidgetIdToBlock< T extends BlockWithWidgetIdAttributes >(
	block: T,
	widgetId: string
): T {
	return {
		...block,
		attributes: {
			...( block.attributes || {} ),
			__internalWidgetId: widgetId,
		},
	};
}

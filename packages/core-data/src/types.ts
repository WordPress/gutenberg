export interface AnyFunction {
	( ...args: any[] ): any;
}

/**
 * Avoid a circular dependency with @wordpress/editor
 *
 * Additionaly, this type marks `attributeKey` and `offset` as possibly
 * `undefined`, which can happen in two known scenarios:
 *
 * 1. If a user has an entire block highlighted (e.g., a `core/image` block).
 * 2. If there's an intermediate selection state while inserting a block, those
 *    properties will be temporarily`undefined`.
 */
export interface WPBlockSelection {
	clientId: string;
	attributeKey?: string;
	offset?: number;
}

export interface WPSelection {
	selectionEnd: WPBlockSelection;
	selectionStart: WPBlockSelection;
}

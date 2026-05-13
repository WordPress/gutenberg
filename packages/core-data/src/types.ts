export interface AnyFunction {
	( ...args: any[] ): any;
}

/**
 * A selected block endpoint.
 *
 * This type mirrors the block-editor and editor store selection shape without
 * coupling core-data to a synchronization implementation.
 */
export interface WPBlockSelection {
	clientId: string;
	attributeKey?: string;
	offset?: number;
}

export interface WPSelection {
	selectionEnd: WPBlockSelection;
	selectionStart: WPBlockSelection;
	initialPosition?: number | null;
}

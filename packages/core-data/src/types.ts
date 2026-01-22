export interface AnyFunction {
	( ...args: any[] ): any;
}

// Avoid a circular dependency with @wordpress/editor
export interface WPBlockSelection {
	clientId: string;
	attributeKey: string;
	offset: number;
}

export interface WPSelection {
	selectionEnd: WPBlockSelection;
	selectionStart: WPBlockSelection;
}

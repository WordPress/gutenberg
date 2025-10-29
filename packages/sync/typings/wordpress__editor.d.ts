declare module '@wordpress/editor' {
	interface WPBlockSelection {
		clientId: string;
		attributeKey: string;
		offset: number;
	}

	interface WPSelection {
		selectionEnd: WPBlockSelection;
		selectionStart: WPBlockSelection;
	}
}

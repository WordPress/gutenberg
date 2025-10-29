declare module '@wordpress/block-editor' {
	const store: string;

	interface BlockEditorStoreSelectors {
		getSelectionStart: () => WPBlockSelection;
		getSelectionEnd: () => WPBlockSelection;
	}

	interface BlockEditorStoreActions {
		selectionChange: (
			clientId: string | WPSelection,
			attributeKey: string,
			startOffset: number,
			endOffset: number
		) => void;
	}

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

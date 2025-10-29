import type { StoreDescriptor } from '@wordpress/data/build-types/types';
import type { WPBlockSelection, WPSelection } from '@wordpress/editor';

declare module '@wordpress/block-editor' {
	const store: {
		name: string | StoreDescriptor< any >;
	};

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
}

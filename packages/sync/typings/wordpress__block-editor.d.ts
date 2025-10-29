import type { WPBlockSelection, WPSelection } from '@wordpress/editor';
import type { AnyConfig, StoreDescriptor } from '@wordpress/data/build-types/types';

declare module '@wordpress/block-editor' {
	export const store: StoreDescriptor< AnyConfig >;

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

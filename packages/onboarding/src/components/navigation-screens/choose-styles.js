/**
 * WordPress dependencies
 */
// eslint-disable-next-line no-restricted-imports
import {
	StyleVariationsContainer,
	GlobalStylesProvider,
} from '@wordpress/edit-site';
import { BlockEditorProvider } from '@wordpress/block-editor';

export default function ChooseStyles() {
	return (
		<GlobalStylesProvider>
			<BlockEditorProvider>
				<StyleVariationsContainer />
			</BlockEditorProvider>
		</GlobalStylesProvider>
	);
}

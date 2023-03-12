/**
 * WordPress dependencies
 */
// eslint-disable-next-line no-restricted-imports
import {
	StyleVariationsContainer,
	GlobalStylesProvider,
} from '@wordpress/edit-site';

export default function ChooseStyles() {
	return (
		<GlobalStylesProvider>
			<StyleVariationsContainer />
		</GlobalStylesProvider>
	);
}

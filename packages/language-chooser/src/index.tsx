/**
 * WordPress dependencies
 */
import { createRoot, StrictMode } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { LanguageChooserConfig } from './types';
import LanguageChooser from './components/language-chooser';

export type * from './types';

/**
 * Initializes the site editor screen.
 *
 * @param {string} id       ID of the root element to render the screen in.
 * @param {Object} settings Language chooser settings.
 */
export function initializeLanguageChooser(
	id: string,
	settings: LanguageChooserConfig
) {
	const target = document.getElementById( id ) as HTMLElement;
	const root = createRoot( target );

	root.render(
		<StrictMode>
			<LanguageChooser { ...settings } />
		</StrictMode>
	);
}

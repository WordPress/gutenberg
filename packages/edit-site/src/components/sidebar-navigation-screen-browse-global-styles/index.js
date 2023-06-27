/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { BlockEditorProvider } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import { store as editSiteStore } from '../../store';
import StyleVariationsContainer from '../global-styles/style-variations-container';
import SidebarNavigationScreen from '../sidebar-navigation-screen';

const noop = () => {};

export default function SidebarNavigationScreenBrowseGlobalStyles() {
	const { storedSettings } = useSelect( ( select ) => {
		const { getSettings } = unlock( select( editSiteStore ) );

		return {
			storedSettings: getSettings( false ),
		};
	}, [] );
	return (
		<SidebarNavigationScreen
			title={ __( 'Browse styles' ) }
			description={ __(
				'Choose a different style combination for the theme styles.'
			) }
			content={
				// Wrap in a BlockEditorProvider to ensure that the Iframe's dependencies are
				// loaded. This is necessary because the Iframe component waits until
				// the block editor store's `__internalIsInitialized` is true before
				// rendering the iframe. Without this, the iframe previews will not render
				// in mobile viewport sizes, where the editor canvas is hidden.
				<BlockEditorProvider
					settings={ storedSettings }
					onChange={ noop }
					onInput={ noop }
				>
					<StyleVariationsContainer />
				</BlockEditorProvider>
			}
		/>
	);
}

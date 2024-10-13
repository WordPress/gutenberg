/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { __experimentalVStack as VStack } from '@wordpress/components';
import { BlockEditorProvider } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import StyleVariationsContainer from '../global-styles/style-variations-container';
import { unlock } from '../../lock-unlock';
import { store as editSiteStore } from '../../store';
import ColorVariations from '../global-styles/variations/variations-color';
import TypographyVariations from '../global-styles/variations/variations-typography';

const noop = () => {};

export default function SidebarNavigationScreenGlobalStylesContent() {
	const { storedSettings } = useSelect( ( select ) => {
		const { getSettings } = unlock( select( editSiteStore ) );

		return {
			storedSettings: getSettings(),
		};
	}, [] );

	const gap = 3;

	// Wrap in a BlockEditorProvider to ensure that the Iframe's dependencies are
	// loaded. This is necessary because the Iframe component waits until
	// the block editor store's `__internalIsInitialized` is true before
	// rendering the iframe. Without this, the iframe previews will not render
	// in mobile viewport sizes, where the editor canvas is hidden.
	return (
		<BlockEditorProvider
			settings={ storedSettings }
			onChange={ noop }
			onInput={ noop }
		>
			<VStack
				spacing={ 10 }
				className="edit-site-global-styles-variation-container"
			>
				<StyleVariationsContainer gap={ gap } />
				<ColorVariations title={ __( 'Palettes' ) } gap={ gap } />
				<TypographyVariations
					title={ __( 'Typography' ) }
					gap={ gap }
				/>
			</VStack>
		</BlockEditorProvider>
	);
}

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { __experimentalVStack as VStack } from '@wordpress/components';

/**
 * Internal dependencies
 */
import StyleVariationsContainer from '../global-styles/style-variations-container';
import ColorVariations from '../global-styles/variations/variations-color';
import TypographyVariations from '../global-styles/variations/variations-typography';

export default function SidebarNavigationScreenGlobalStylesContent() {
	const gap = 3;

	return (
		<VStack
			spacing={ 10 }
			className="edit-site-global-styles-variation-container"
		>
			<StyleVariationsContainer gap={ gap } />
			<ColorVariations title={ __( 'Palettes' ) } gap={ gap } />
			<TypographyVariations title={ __( 'Typography' ) } gap={ gap } />
		</VStack>
	);
}

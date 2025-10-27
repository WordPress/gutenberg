/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { __experimentalVStack as VStack } from '@wordpress/components';
import {
	StyleVariations,
	ColorVariations,
	TypographyVariations,
} from '@wordpress/global-styles-ui';

/**
 * Internal dependencies
 */
import { useGlobalStyles } from '../global-styles';

export default function SidebarNavigationScreenGlobalStylesContent() {
	const gap = 3;
	const {
		user: userConfig,
		base: baseConfig,
		setUser: setUserConfig,
	} = useGlobalStyles();

	return (
		<VStack
			spacing={ 10 }
			className="edit-site-global-styles-variation-container"
		>
			<StyleVariations
				value={ userConfig }
				baseValue={ baseConfig || {} }
				onChange={ setUserConfig }
				gap={ gap }
			/>
			<ColorVariations
				value={ userConfig }
				baseValue={ baseConfig || {} }
				onChange={ setUserConfig }
				title={ __( 'Palettes' ) }
				gap={ gap }
			/>
			<TypographyVariations
				value={ userConfig }
				baseValue={ baseConfig || {} }
				onChange={ setUserConfig }
				title={ __( 'Typography' ) }
				gap={ gap }
			/>
		</VStack>
	);
}

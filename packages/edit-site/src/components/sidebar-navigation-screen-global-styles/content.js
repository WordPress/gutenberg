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
import { privateApis as editorPrivateApis } from '@wordpress/editor';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const { useGlobalStyles } = unlock( editorPrivateApis );

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

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { __experimentalVStack as VStack } from '@wordpress/components';
import { store as editorStore } from '@wordpress/editor';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import TypographyElements from './typography-elements';
import TypographyVariations from './variations-typography';
import FontFamilies from './font-families';
import ScreenHeader from './header';
import { useCurrentMergeThemeStyleVariationsWithUserConfig } from '../../hooks/use-theme-style-variations/use-theme-style-variations-by-property';

function ScreenTypography() {
	const fontLibraryEnabled = useSelect(
		( select ) =>
			select( editorStore ).getEditorSettings().fontLibraryEnabled,
		[]
	);
	const typographyVariations =
		useCurrentMergeThemeStyleVariationsWithUserConfig( {
			property: 'typography',
			filter: ( variation ) =>
				variation?.settings?.typography?.fontFamilies &&
				Object.keys( variation?.settings?.typography?.fontFamilies )
					.length,
		} );

	return (
		<>
			<ScreenHeader
				title={ __( 'Typography' ) }
				description={ __(
					'Manage the typography settings for different elements.'
				) }
			/>
			<div className="edit-site-global-styles-screen-typography">
				<VStack spacing={ 6 }>
					{ !! typographyVariations.length && (
						<TypographyVariations />
					) }
					{ ! window.__experimentalDisableFontLibrary && (
						<VStack spacing={ 3 }>
							{ fontLibraryEnabled && <FontFamilies /> }
						</VStack>
					) }
					<TypographyElements />
				</VStack>
			</div>
		</>
	);
}

export default ScreenTypography;

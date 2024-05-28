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
import TypographyVariations from './variations/variations-typography';
import FontFamilies from './font-families';
import ScreenHeader from './header';

function ScreenTypography() {
	const fontLibraryEnabled = useSelect(
		( select ) =>
			select( editorStore ).getEditorSettings().fontLibraryEnabled,
		[]
	);

	return (
		<>
			<ScreenHeader
				title={ __( 'Typography' ) }
				description={ __(
					'Typography styles and the application of those styles on site elements.'
				) }
			/>
			<div className="edit-site-global-styles-screen">
				<VStack spacing={ 7 }>
					{ ! window.__experimentalDisableFontLibrary &&
						fontLibraryEnabled && <FontFamilies /> }
					<TypographyElements />
					<TypographyVariations title={ __( 'Presets' ) } />
				</VStack>
			</div>
		</>
	);
}

export default ScreenTypography;

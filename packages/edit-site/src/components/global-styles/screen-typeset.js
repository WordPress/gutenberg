/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { __experimentalVStack as VStack } from '@wordpress/components';

/**
 * Internal dependencies
 */
import TypographyVariations from './variations/variations-typography';
import ScreenHeader from './header';
import FontFamilies from './font-families';

function ScreenTypeset() {
	const fontLibraryEnabled = useSelect(
		( select ) =>
			select( editorStore ).getEditorSettings().fontLibraryEnabled,
		[]
	);

	return (
		<>
			<ScreenHeader
				title={ __( 'Typesets' ) }
				description={ __(
					'Fonts and typographic styling applied across the site.'
				) }
			/>
			<div className="edit-site-global-styles-screen">
				<VStack spacing={ 7 }>
					<TypographyVariations />

					{ fontLibraryEnabled && <FontFamilies /> }
				</VStack>
			</div>
		</>
	);
}

export default ScreenTypeset;

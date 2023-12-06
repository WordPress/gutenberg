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
import FontFamilies from './font-families';
import ScreenHeader from './header';
import TypographyVariations from './variations-typography';

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
					'Manage the typography settings for different elements.'
				) }
			/>
			<div className="edit-site-global-styles-screen-typography">
				<VStack spacing={ 6 }>
					{ fontLibraryEnabled && <FontFamilies /> }
					<TypographyElements />
					<TypographyVariations />
				</VStack>
			</div>
		</>
	);
}

export default ScreenTypography;

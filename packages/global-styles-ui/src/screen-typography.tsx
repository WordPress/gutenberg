/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { __experimentalVStack as VStack } from '@wordpress/components';
import { useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { ScreenHeader } from './screen-header';
import TypographyElements from './typography-elements';
import TypographyVariations from './variations/variations-typography';
import FontFamilies from './font-families';
import FontSizesCount from './font-sizes/font-sizes-count';
import { GlobalStylesContext } from './context';

function ScreenTypography() {
	const { fontLibraryEnabled } = useContext( GlobalStylesContext );

	return (
		<>
			<ScreenHeader
				title={ __( 'Typography' ) }
				description={ __(
					'Available fonts, typographic styles, and the application of those styles.'
				) }
			/>
			<div className="global-styles-ui-screen">
				<VStack spacing={ 7 }>
					<TypographyVariations title={ __( 'Typesets' ) } />
					{ fontLibraryEnabled && <FontFamilies /> }
					<TypographyElements />
					<FontSizesCount />
				</VStack>
			</div>
		</>
	);
}

export default ScreenTypography;

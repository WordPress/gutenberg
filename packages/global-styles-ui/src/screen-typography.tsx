import { __ } from '@wordpress/i18n';
import { __experimentalVStack as VStack } from '@wordpress/components';
import { useContext } from '@wordpress/element';
import { ScreenHeader } from './screen-header';
import { ScreenBody } from './screen-body';
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
					'Manage the fonts and typographic styles available across the site.'
				) }
			/>
			<ScreenBody>
				<VStack spacing={ 7 }>
					<TypographyVariations title={ __( 'Typesets' ) } />
					{ fontLibraryEnabled && <FontFamilies /> }
					<FontSizesCount />
				</VStack>
			</ScreenBody>
		</>
	);
}

export default ScreenTypography;

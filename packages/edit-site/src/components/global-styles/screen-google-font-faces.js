/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import ScreenHeader from './header';
import AddFontFaceItem from './add-font-face-item';
import Subtitle from './subtitle';
import { useFontFamilies } from './hooks';

function ScreenGoogleFontFacesList( { googleFontSelected: font } ) {
	const { fontFamilies, getFontSlug } = useFontFamilies();

	const existingFamilyIndex = fontFamilies.findIndex(
		( { slug } ) => slug === getFontSlug( font.family )
	);

	return (
		<>
			<ScreenHeader
				title={ __( 'Add Google Font Variants' ) }
				description={ __(
					'Select the font variants you want to include in your site'
				) }
			/>

			<div
				style={ {
					background: '#eee',
					padding: '1rem',
					display: 'flex',
					flexDirection: 'column',
					gap: '1rem',
				} }
			>
				{ font && (
					<Subtitle>{ font.family + __( ' variants:' ) }</Subtitle>
				) }

				{ font &&
					font.variants.map( ( variant, i ) => {
						const style = variant.includes( 'italic' )
							? 'italic'
							: 'normal';
						const weight =
							variant.replace( 'italic', '' ) === 'regular'
								? '400'
								: variant.replace( 'italic', '' );

						const isExistingFace =
							existingFamilyIndex !== -1 &&
							fontFamilies[ existingFamilyIndex ]?.fontFace?.find(
								( {
									fontWeight,
									fontStyle,
									shouldBeRemoved,
								} ) =>
									fontWeight === weight &&
									fontStyle === style &&
									! shouldBeRemoved
							);

						const fontFace = {
							fontFamily: font.family,
							fontStyle: style,
							fontWeight: weight,
							url: font.files[ variant ],
						};

						return (
							<AddFontFaceItem
								fontFace={ fontFace }
								isExistingFace={ isExistingFace }
								key={ `variant-${ i }` }
							/>
						);
					} ) }
			</div>
		</>
	);
}

export default ScreenGoogleFontFacesList;

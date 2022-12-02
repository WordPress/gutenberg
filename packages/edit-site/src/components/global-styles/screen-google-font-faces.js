/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Icon, plusCircle, check } from '@wordpress/icons';
import { Tooltip, Button } from '@wordpress/components';

/**
 * Internal dependencies
 */
import ScreenHeader from './header';
import FontFaceItem from './font-face-item';
import Subtitle from './subtitle';
import { useFontFamilies } from './hooks';

function ScreenGoogleFontFacesList({ googleFontSelected: font }) {
	const { fontFamilies, handleAddFontFace, handleRemoveFontFace, getFontSlug } = useFontFamilies();
	const existingFamilyIndex = fontFamilies.findIndex( ( { slug } ) => slug === getFontSlug( font.family ) );

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
				<Subtitle>{ font.family + __( ' variants:' ) }</Subtitle>

				{ font &&
					font.variants.map( ( variant ) => {

						const style = variant.includes( 'italic' )
							? 'italic'
							: 'normal';
						const weight = variant.replace( 'italic', '' ) === 'regular'
							? '400'
							: variant.replace( 'italic', '' );

						const isExistingFace = existingFamilyIndex !== -1 &&
							fontFamilies[ existingFamilyIndex ]?.fontFace?.find(
								( { fontWeight, fontStyle } ) => fontWeight === weight && fontStyle === style
							);

						const fontFace = {
							fontFamily: font.family,
							fontStyle: style,
							fontWeight: weight,
							url: font.files[ variant ],
						};

						return (
							<FontFaceItem
								key={ variant }
								fontFace={ fontFace }
								title={ variant }
								actionTrigger={
									!isExistingFace ? (
										<Tooltip
										text={ __( 'Add font face' ) }
										delay={ 0 }
										>
											<Button
												style={ { padding: '0 8px' } }
												onClick={ () =>
													handleAddFontFace(
														fontFace.fontFamily,
														fontFace.fontWeight,
														fontFace.fontStyle,
														fontFace.url,
													)
												}
											>
												<Icon
													icon={ plusCircle }
													size={ 20 }
												/>
											</Button>
										</Tooltip>
									) : (
										<Tooltip
											text={ __( 'Remove Font Face' ) }
											delay= { 0 }
										>
											<Button
												style={ { padding: '0 8px' } }
												onClick={ () => handleRemoveFontFace( font.family, weight, style ) }
											>
												<Icon
													icon={ check }
													size={ 20 }
												/>
											</Button>
										</Tooltip>	
									)
								}
							/>
						);
					} ) }
			</div>
		</>
	);
}

export default ScreenGoogleFontFacesList;

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Icon, check } from '@wordpress/icons';
import { Tooltip, Button } from '@wordpress/components';

/**
 * Internal dependencies
 */
import ScreenHeader from './header';
import Subtitle from './subtitle';
import { useFontFamilies } from './hooks';
import FontFaceItem from './font-face-item';

function ScreenThemeFontFacesList( { themeFontSelected } ) {
	const { fontFamilies, handleRemoveFontFace, sortFontFaces } =
		useFontFamilies();
	const font = fontFamilies[ themeFontSelected ];

	return (
		<>
			<ScreenHeader
				title={ __( 'Font Variants' ) }
				description={ __( 'Variants of the selected font family' ) }
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
					<Subtitle>
						{ ( font.name || font.fontFamily ) +
							__( ' variants:' ) }
					</Subtitle>
				) }

				{ ! font && <p>{ __( 'No font faces available' ) }</p> }

				{ font &&
					Array.isArray( font.fontFace ) &&
					sortFontFaces( font.fontFace ).map( ( fontFace, i ) => {
						return (
							! fontFace.shouldBeRemoved && (
								<FontFaceItem
									fontFace={ fontFace }
									key={ `font-face-${ i }` }
									actionTrigger={
										<Tooltip
											text={ __( 'Remove Font Face' ) }
											delay={ 0 }
										>
											<Button
												style={ { padding: '0 8px' } }
												onClick={ () =>
													handleRemoveFontFace(
														fontFace.fontFamily,
														fontFace.fontWeight,
														fontFace.fontStyle
													)
												}
											>
												<Icon
													icon={ check }
													size={ 20 }
												/>
											</Button>
										</Tooltip>
									}
								/>
							)
						);
					} ) }
			</div>
		</>
	);
}

export default ScreenThemeFontFacesList;

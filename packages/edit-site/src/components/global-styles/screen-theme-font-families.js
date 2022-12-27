/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	__experimentalNavigatorButton as NavigatorButton,
	__experimentalSurface as Surface,
	__experimentalUseNavigator as useNavigator,
	Tooltip,
} from '@wordpress/components';
import { Icon, chevronRight } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import ScreenHeader from './header';
import FontFaceItem from './font-face-item';
import { useFontFamilies } from './hooks';

function ScreenThemeFontFamilies( { setThemeFontSelected } ) {
	const { fontFamilies, count } = useFontFamilies();
	const { goBack } = useNavigator();

	// we do this instead of filtering the font families in the useFontFamilies hook because we need to keep the index of the font families to set the selected font family.
	const shouldDisplayFontFamily = ( fontFamily ) => {
		// If the font family has no font faces, it should be displayed.
		if ( ! fontFamily.fontFace ) {
			return true;
		}
		// If the font family has font faces, it should be displayed if at least one of them is not flagged as shouldBeRemoved.
		return fontFamily.fontFace.some(
			( fontFace ) => ! fontFace.shouldBeRemoved
		);
	};

	if ( ! count ) {
		goBack();
	}

	const handleClick = ( index ) => {
		setThemeFontSelected( index );
	};

	return (
		<>
			<ScreenHeader
				title={ __( 'Font Families' ) }
				description={
					count
						? __( 'Font families included available' )
						: __( 'No font families available' )
				}
			/>
			<Surface
				style={ {
					background: '#eee',
					padding: '1rem',
					display: 'flex',
					flexDirection: 'column',
					gap: '1rem',
				} }
			>
				{ fontFamilies.map( ( family, i ) => {
					const fontFace = {
						name: family.name,
						fontFamily: family.fontFamily,
						fontStyle: 'normal',
						fontWeight: '400',
					};

					if ( ! shouldDisplayFontFamily( family ) ) {
						return null;
					}

					return (
						<FontFaceItem
							key={ `family-${ i }` }
							fontFace={ fontFace }
							title={
								<strong>
									{ fontFace.name || fontFace.fontFamily }
								</strong>
							}
							actionTrigger={
								family.fontFace?.length && (
									<Tooltip
										text={ __( 'View font variants' ) }
									>
										<NavigatorButton
											path="/typography/font-families/theme-font-faces"
											onClick={ () => {
												handleClick( i );
											} }
										>
											<Icon
												icon={ chevronRight }
												size={ 15 }
											/>
										</NavigatorButton>
									</Tooltip>
								)
							}
						/>
					);
				} ) }
			</Surface>
		</>
	);
}

export default ScreenThemeFontFamilies;

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Icon, check } from '@wordpress/icons';
import {
	Tooltip,
	Button,
	__experimentalUseNavigator as useNavigator,
} from '@wordpress/components';
import { useMemo, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import ScreenHeader from './header';
import Subtitle from './subtitle';
import { useFontFamilies } from './hooks';
import FontFaceItem from './font-face-item';

function ScreenThemeFontFacesList( { themeFontSelected } ) {
	const { goBack } = useNavigator();
	const { fontFamilies, handleRemoveFontFace, sortFontFaces } =
		useFontFamilies();
	const font = fontFamilies[ themeFontSelected ];
	const getFontFaces = ( fontFamily ) => {
		if ( ! fontFamily || ! Array.isArray( fontFamily.fontFace ) ) {
			return [];
		}
		return sortFontFaces(
			font.fontFace.filter( ( fontFace ) => ! fontFace.shouldBeRemoved )
		);
	};
	const fontFaces = useMemo( () => getFontFaces( font ), [ fontFamilies ] );

	useEffect( () => {
		// Go Back if no font faces are available
		// This can happen if all font faces are flagged as shouldBeRemoved and the change is saved.
		// After the change is saved, the font faces are removed from the font family and the font faces are no longer available.
		if ( ! fontFaces.length ) {
			goBack();
		}
	}, [ fontFamilies ] );

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

				{ fontFaces.map( ( fontFace, i ) => (
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
									<Icon icon={ check } size={ 20 } />
								</Button>
							</Tooltip>
						}
					/>
				) ) }
			</div>
		</>
	);
}

export default ScreenThemeFontFacesList;

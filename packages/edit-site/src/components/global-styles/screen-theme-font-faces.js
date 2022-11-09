/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import ScreenHeader from './header';
import FontFaceItem from './font-face-item';
import Subtitle from './subtitle';

function ScreenThemeFontFacesList( { themeFontSelected: font } ) {
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
				<Subtitle>
					{ ( font.name || font.fontFamily ) + __( ' variants:' ) }
				</Subtitle>

				{ font &&
					font.fontFace &&
					font.fontFace.map( ( fontFace, i ) => {
						return (
							<FontFaceItem
								key={ `fontface-${ i }` }
								fontFace={ fontFace }
								title={ `${ fontFace.fontWeight } ${ fontFace.fontStyle }` }
							/>
						);
					} ) }
			</div>
		</>
	);
}

export default ScreenThemeFontFacesList;

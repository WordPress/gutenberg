/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Icon, chevronRight } from '@wordpress/icons';
import {
	Tooltip,
	__experimentalNavigatorButton as NavigatorButton,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import FontFaceItem from './font-face-item';

/**
 * Data
 */
import googleFontsData from './google-fonts.json';

function TabGoogleFontFamilies( { setGoogleFontSelected } ) {
	const handleClick = ( font ) => {
		setGoogleFontSelected( font );
	};

	return (
		<>
			<div
				style={ {
					background: '#eee',
					padding: '1rem',
					display: 'flex',
					flexDirection: 'column',
					gap: '1rem',
				} }
			>
				{ googleFontsData.map( ( font ) => {
					const fontFace = {
						fontFamily: font.family,
						fontStyle: 'normal',
						fontWeight: '400',
						url: font.files.regular || font.files[ '400' ],
					};

					return (
						<FontFaceItem
							key={ font.family }
							fontFace={ fontFace }
							title={ <strong>{ font.family }</strong> }
							actionTrigger={
								<Tooltip
									text={ __( 'View font variants' ) }
									delay={ 0 }
								>
									<NavigatorButton
										path="/typography/font-families/google-font-faces"
										onClick={ () => {
											handleClick( font );
										} }
									>
										<Icon
											icon={ chevronRight }
											size={ 15 }
										/>
									</NavigatorButton>
								</Tooltip>
							}
						/>
					);
				} ) }
			</div>
		</>
	);
}

export default TabGoogleFontFamilies;

/**
 * Internal dependencies
 */
import { Font } from '../../../../lib/lib-font.browser';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { __experimentalHStack as HStack, Button } from '@wordpress/components';
import { useState, useEffect } from '@wordpress/element';
import { cancelCircleFilled } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import FontVariant from './font-variant';

function LocalFontVariant( { fontFile, onFontFaceLoad, onFontFaceRemove } ) {
	const [ fontData, setFontData ] = useState( null );

	useEffect( () => {
		// Use FileReader to, well, read the file
		const reader = new FileReader();
		reader.readAsArrayBuffer( fontFile );

		reader.onload = () => {
			// Create a font object
			const fontObj = new Font( 'Uploaded Font' );

			// Pass the buffer, and the original filename
			fontObj.fromDataBuffer( reader.result, fontFile.name );

			fontObj.onload = async ( onloadEvent ) => {
				// Map the details LibFont gathered from the font to the
				// "font" variable
				const font = onloadEvent.detail.font;

				// From all the OpenType tables in the font, take the "name"
				// table so we can inspect it further
				const { name } = font.opentype.tables;

				// the Font Family name. More info and names you can grab:
				// https://docs.microsoft.com/en-us/typography/opentype/spec/name

				const fontName = name.get( 16 ) || name.get( 1 );
				const isItalic = name
					.get( 2 )
					.toLowerCase()
					.includes( 'italic' );
				const fontWeight =
					font.opentype.tables[ 'OS/2' ].usWeightClass || 'normal';

				// Variable fonts info
				const isVariable = !! font.opentype.tables.fvar;
				const weightAxis =
					isVariable &&
					font.opentype.tables.fvar.axes.find(
						( { tag } ) => tag === 'wght'
					);
				const weightRange = !! weightAxis
					? `${ weightAxis.minValue } ${ weightAxis.maxValue }`
					: null;

				const fontFaceData = {
					file: fontFile,
					fontFamily: fontName,
					fontStyle: isItalic ? 'italic' : 'normal',
					fontWeight: !! weightAxis ? weightRange : fontWeight,
				};

				const data = await fontFaceData.file.arrayBuffer();
				const newFont = new FontFace( fontFaceData.fontFamily, data, {
					style: fontFaceData.fontStyle,
					weight: fontFaceData.fontWeight,
				} );

				newFont
					.load()
					.then( function ( loadedFace ) {
						document.fonts.add( loadedFace );
					} )
					.catch( function ( error ) {
						// TODO: show error in the UI
						// eslint-disable-next-line
                        console.error( error );
					} );

				setFontData( fontFaceData );
				onFontFaceLoad( fontFaceData );
			};
		};
	}, [ fontFile ] );

	const handleRemove = () => {
		onFontFaceRemove( fontData );
	};

	return (
		!! fontData && (
			<FontVariant
				fontFace={ fontData }
				text={ `${ fontData?.fontFamily } ${ fontData?.fontStyle } ${ fontData?.fontWeight }` }
				variantName={
					<HStack spacing={ 3 } justify="flex-start">
						<span className="font-library-modal__font-name">
							{ fontData?.fontFamily }
						</span>
						<span>
							{ fontData?.fontStyle } { fontData?.fontWeight }
						</span>
						<span className="font-library-modal__font-filename">
							{ fontData?.file.name }
						</span>
					</HStack>
				}
				actionHandler={
					<Button
						onClick={ handleRemove }
						icon={ cancelCircleFilled }
						isSmall
					/>
				}
			/>
		)
	);
}

export default LocalFontVariant;

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Icon, plusCircle, check } from '@wordpress/icons';
import { Tooltip, Button } from '@wordpress/components';

/**
 * Internal dependencies
 */
import FontFaceItem from './font-face-item';
import { useFontFamilies } from './hooks';

function readFileAsBase64( file ) {
	return new Promise( ( resolve, reject ) => {
		const reader = new FileReader();
		reader.onload = () => {
			resolve( reader.result );
		};
		reader.onerror = reject;
		reader.readAsDataURL( file );
	} );
}

async function downloadAndEncode( url ) {
	try {
		// Send an HTTP GET request to the URL
		const response = await fetch( url );
		// Check the status code of the response
		if ( ! response.ok ) {
			throw new Error(
				`HTTP error: ${ response.status } ${ response.statusText }`
			);
		}
		// Get the response as a blob
		const blob = await response.blob();
		const metadata = { type: blob.type };
		const file = new File( [ blob ], 'font-file', metadata );
		const base64 = await readFileAsBase64( file );
		return base64;
	} catch ( error ) {
		return null;
	}
}

function AddFontFace( { fontFace, isExistingFace } ) {
	const { handleAddFontFace, handleRemoveFontFace } = useFontFamilies();

	async function handleAdd( fontFamily, fontWeight, fontStyle, url ) {
		const base64 = await downloadAndEncode( url );
		if ( ! base64 ) {
			// TODO: show error message
			return;
		}
		const newFontFace = {
			fontFamily,
			fontWeight,
			fontStyle,
			base64,
		};
		handleAddFontFace( newFontFace );
	}

	return (
		<FontFaceItem
			key={ `${ fontFace.fontWeight }-${ fontFace.fontStyle }` }
			fontFace={ fontFace }
			title={ `${ fontFace.fontWeight } ${ fontFace.fontStyle }` }
			actionTrigger={
				! isExistingFace ? (
					<Tooltip text={ __( 'Add font face' ) } delay={ 0 }>
						<Button
							style={ { padding: '0 8px' } }
							onClick={ () =>
								handleAdd(
									fontFace.fontFamily,
									fontFace.fontWeight,
									fontFace.fontStyle,
									fontFace.url
								)
							}
						>
							<Icon icon={ plusCircle } size={ 20 } />
						</Button>
					</Tooltip>
				) : (
					<Tooltip text={ __( 'Remove Font Face' ) } delay={ 0 }>
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
				)
			}
		/>
	);
}

export default AddFontFace;

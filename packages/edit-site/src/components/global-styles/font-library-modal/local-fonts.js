/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	DropZone,
	__experimentalSpacer as Spacer,
	__experimentalText as Text,
	FormFileUpload,
} from '@wordpress/components';
import { useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { ALLOWED_FILE_EXTENSIONS } from './constants';
import { FontLibraryContext } from './context';
import { Font } from '../../../../lib/lib-font.browser';

function LocalFonts() {
	const { installFonts, refreshLibrary } = useContext( FontLibraryContext );

	const handleDropZone = ( files ) => {
		handleFilesUpload( files );
	};
	const onFilesUpload = ( event ) => {
		handleFilesUpload( event.target.files );
	};

	/**
	 * Filters the selected files to only allow the ones with the allowed extensions
	 *
	 * @param {Array} files The files to be filtered
	 * @return {Array} The filtered files
	 */
	const handleFilesUpload = ( files ) => {
		const uniqueFilenames = new Set();
		const selectedFiles = [ ...files ];
		const allowedFiles = selectedFiles.filter( ( file ) => {
			if ( uniqueFilenames.has( file.name ) ) {
				return false; // Discard duplicates
			}
			// Eliminates files that are not allowed
			const fileExtension = file.name.split( '.' ).pop().toLowerCase();
			if ( ALLOWED_FILE_EXTENSIONS.includes( fileExtension ) ) {
				uniqueFilenames.add( file.name );
				return true; // Keep file if the extension is allowed
			}
			return false; // Discard file extension not allowed
		} );
		if ( allowedFiles.length > 0 ) {
			loadFiles( allowedFiles );
		}
	};

	/**
	 * Loads the selected files and reads the font metadata
	 *
	 * @param {Array} selectedFiles The files to be loaded
	 * @return {void}
	 *
	 */
	const loadFiles = async ( files ) => {
		const fontFacesLoaded = await Promise.all(
			files.map( async (fontFile) => {
				const fontFaceData = await getFontFaceMetadata( fontFile );
				await addFontFaceToBrowser( fontFaceData );
				return fontFaceData;
			}
		) );
		await handleInstall( fontFacesLoaded );
	};

	// Create a function to read the file as array buffer
	async function readFileAsArrayBuffer( file ) {
		return new Promise( ( resolve, reject ) => {
			const reader = new FileReader();
			reader.readAsArrayBuffer( file );
			reader.onload = () => resolve( reader.result );
			reader.onerror = reject;
		} );
	}

	const getFontFaceMetadata = async ( fontFile ) => {
		const buffer = await readFileAsArrayBuffer( fontFile );
		const fontObj = new Font( 'Uploaded Font' );
		fontObj.fromDataBuffer( buffer, fontFile.name );
		// Assuming that fromDataBuffer triggers onload event and returning a Promise
		const onloadEvent = await new Promise(
			( resolve ) => ( fontObj.onload = resolve )
		);
		const font = onloadEvent.detail.font;
		const { name } = font.opentype.tables;
		const fontName = name.get( 16 ) || name.get( 1 );
		const isItalic = name.get( 2 ).toLowerCase().includes( 'italic' );
		const fontWeight =
			font.opentype.tables[ 'OS/2' ].usWeightClass || 'normal';
		const isVariable = !! font.opentype.tables.fvar;
		const weightAxis =
			isVariable &&
			font.opentype.tables.fvar.axes.find(
				( { tag } ) => tag === 'wght'
			);
		const weightRange = weightAxis
			? `${ weightAxis.minValue } ${ weightAxis.maxValue }`
			: null;
		return {
			file: fontFile,
			fontFamily: fontName,
			fontStyle: isItalic ? 'italic' : 'normal',
			fontWeight: weightRange || fontWeight,
		}
	}

	const addFontFaceToBrowser = async  (fontFaceData ) => {
		const data = await fontFaceData.file.arrayBuffer();
		const newFont = new FontFace( fontFaceData.fontFamily, data, {
			style: fontFaceData.fontStyle,
			weight: fontFaceData.fontWeight,
		} );
		const loadedFace = await newFont.load();
		document.fonts.add( loadedFace );
	} 

	/**
	 * Creates the font family definition and sends it to the server
	 *
	 * @param {Array} fontFaces The font faces to be installed
	 * @return {void}
	 */
	const handleInstall = async ( fontFaces ) => {
		const formData = new FormData();
		// Creates the fontFamilies array that will be sent to the server
		const fontFamiliesObject = fontFaces.reduce(
			( acc, { file, ...item }, i ) => {
				if ( ! acc[ item.fontFamily ] ) {
					acc[ item.fontFamily ] = {
						name: item.fontFamily,
						fontFamily: item.fontFamily,
						slug: item.fontFamily
							.replace( /\s+/g, '-' )
							.toLowerCase(),
						fontFace: [],
					};
				}
				// Add the files to the formData
				formData.append( `files${ i }`, file, file.name );
				// Add the posted file id to the fontFace object
				// This is needed to associate the fontFace with the file on the server
				const face = { ...item, uploadedFile: `files${ i }` };
				acc[ item.fontFamily ].fontFace.push( face );
				return acc;
			},
			{}
		);
		const fontFamilies = Object.values( fontFamiliesObject );
		// Adds the fontFamilies to the formData
		formData.append( 'fontFamilies', JSON.stringify( fontFamilies ) );
		await installFonts( formData );
		refreshLibrary();
	};

	return (
		<>
			<Text className="font-library-modal__subtitle">{ __( "Upload Fonts" ) }</Text>
			<Spacer margin={ 2 } />
			<DropZone onFilesDrop={ handleDropZone } />
			<FormFileUpload
				accept="font/*"
				multiple={ true }
				onChange={ onFilesUpload }
				render={ ( { openFileDialog } ) => (
					<div className="font-library-modal__upload-area" onClick={ openFileDialog }>
						<span>{ __("Drag and drop you font files here.") }</span>
					</div>
				) }
			/>
		</>
	);
}

export default LocalFonts;

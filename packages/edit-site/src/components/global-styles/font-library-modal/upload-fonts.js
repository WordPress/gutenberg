/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	__experimentalSpacer as Spacer,
	__experimentalText as Text,
	__experimentalVStack as VStack,
	Button,
	DropZone,
	Notice,
	FormFileUpload,
	FlexItem,
	ProgressBar,
} from '@wordpress/components';
import { useContext, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { ALLOWED_FILE_EXTENSIONS } from './utils/constants';
import { FontLibraryContext } from './context';
import { Font } from '../../../../lib/lib-font.browser';
import makeFamiliesFromFaces from './utils/make-families-from-faces';
import { loadFontFaceInBrowser } from './utils';

function UploadFonts() {
	const { installFonts } = useContext( FontLibraryContext );
	const [ isUploading, setIsUploading ] = useState( false );
	const [ notice, setNotice ] = useState( false );

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
	 * @return {void}
	 */
	const handleFilesUpload = async ( files ) => {
		setNotice( null );
		setIsUploading( true );
		const uniqueFilenames = new Set();
		const selectedFiles = [ ...files ];
		let hasInvalidFiles = false;

		// Use map to create a promise for each file check, then filter with Promise.all.
		const checkFilesPromises = selectedFiles.map( async ( file ) => {
			const isFont = await isFontFile( file );
			if ( ! isFont ) {
				hasInvalidFiles = true;
				return null; // Return null for invalid files.
			}
			// Check for duplicates
			if ( uniqueFilenames.has( file.name ) ) {
				return null; // Return null for duplicates.
			}
			// Check if the file extension is allowed.
			const fileExtension = file.name.split( '.' ).pop().toLowerCase();
			if ( ALLOWED_FILE_EXTENSIONS.includes( fileExtension ) ) {
				uniqueFilenames.add( file.name );
				return file; // Return the file if it passes all checks.
			}
			return null; // Return null for disallowed file extensions.
		} );

		// Filter out the nulls after all promises have resolved.
		const allowedFiles = ( await Promise.all( checkFilesPromises ) ).filter(
			( file ) => null !== file
		);

		if ( allowedFiles.length > 0 ) {
			loadFiles( allowedFiles );
		} else {
			const message = hasInvalidFiles
				? __( 'Sorry, you are not allowed to upload this file type.' )
				: __( 'No fonts found to install.' );

			setNotice( {
				type: 'error',
				message,
			} );
			setIsUploading( false );
		}
	};

	/**
	 * Loads the selected files and reads the font metadata
	 *
	 * @param {Array} files The files to be loaded
	 * @return {void}
	 */
	const loadFiles = async ( files ) => {
		const fontFacesLoaded = await Promise.all(
			files.map( async ( fontFile ) => {
				const fontFaceData = await getFontFaceMetadata( fontFile );
				await loadFontFaceInBrowser(
					fontFaceData,
					fontFaceData.file,
					'all'
				);
				return fontFaceData;
			} )
		);
		handleInstall( fontFacesLoaded );
	};

	/**
	 * Checks if a file is a valid Font file.
	 *
	 * @param {File} file The file to be checked.
	 * @return {boolean} Whether the file is a valid font file.
	 */
	async function isFontFile( file ) {
		const font = new Font( 'Uploaded Font' );
		try {
			const buffer = await readFileAsArrayBuffer( file );
			await font.fromDataBuffer( buffer, 'font' );
			return true;
		} catch ( error ) {
			return false;
		}
	}

	// Create a function to read the file as array buffer
	async function readFileAsArrayBuffer( file ) {
		return new Promise( ( resolve, reject ) => {
			const reader = new window.FileReader();
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
		};
	};

	/**
	 * Creates the font family definition and sends it to the server
	 *
	 * @param {Array} fontFaces The font faces to be installed
	 * @return {void}
	 */
	const handleInstall = async ( fontFaces ) => {
		const fontFamilies = makeFamiliesFromFaces( fontFaces );

		try {
			await installFonts( fontFamilies );
			setNotice( {
				type: 'success',
				message: __( 'Fonts were installed successfully.' ),
			} );
		} catch ( error ) {
			setNotice( {
				type: 'error',
				message: error.message,
				errors: error?.installationErrors,
			} );
		}

		setIsUploading( false );
	};

	return (
		<div className="font-library-modal__tabpanel-layout">
			<DropZone onFilesDrop={ handleDropZone } />
			<VStack className="font-library-modal__local-fonts">
				{ notice && (
					<Notice
						status={ notice.type }
						__unstableHTML
						onRemove={ () => setNotice( null ) }
					>
						{ notice.message }
						{ notice.errors && (
							<ul>
								{ notice.errors.map( ( error, index ) => (
									<li key={ index }>{ error }</li>
								) ) }
							</ul>
						) }
					</Notice>
				) }
				{ isUploading && (
					<FlexItem>
						<div className="font-library-modal__upload-area">
							<ProgressBar />
						</div>
					</FlexItem>
				) }
				{ ! isUploading && (
					<FormFileUpload
						accept={ ALLOWED_FILE_EXTENSIONS.map(
							( ext ) => `.${ ext }`
						).join( ',' ) }
						multiple
						onChange={ onFilesUpload }
						render={ ( { openFileDialog } ) => (
							<Button
								className="font-library-modal__upload-area"
								onClick={ openFileDialog }
							>
								{ __( 'Upload font' ) }
							</Button>
						) }
					/>
				) }
				<Spacer margin={ 2 } />
				<Text className="font-library-modal__upload-area__text">
					{ __(
						'Uploaded fonts appear in your library and can be used in your theme. Supported formats: .ttf, .otf, .woff, and .woff2.'
					) }
				</Text>
			</VStack>
		</div>
	);
}

export default UploadFonts;

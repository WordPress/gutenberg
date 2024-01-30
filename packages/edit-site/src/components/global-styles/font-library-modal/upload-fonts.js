/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	Button,
	DropZone,
	__experimentalSpacer as Spacer,
	__experimentalText as Text,
	__experimentalVStack as VStack,
	FormFileUpload,
	FlexItem,
	privateApis as componentsPrivateApis,
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
import TabPanelLayout from './tab-panel-layout';
import { unlock } from '../../../lock-unlock';

const { ProgressBar } = unlock( componentsPrivateApis );

function UploadFonts() {
	const { installFont, notice, setNotice } = useContext( FontLibraryContext );
	const [ isUploading, setIsUploading ] = useState( false );

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
	const handleFilesUpload = ( files ) => {
		setNotice( null );
		setIsUploading( true );
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

		if ( fontFamilies.length > 1 ) {
			setNotice( {
				type: 'error',
				message: __(
					'Variants from only one font family can be uploaded at a time.'
				),
			} );
			setIsUploading( false );
			return;
		}

		try {
			await installFont( fontFamilies[ 0 ] );
			setNotice( {
				type: 'success',
				message: __( 'Fonts were installed successfully.' ),
			} );
		} catch ( error ) {
			setNotice( {
				type: 'error',
				message: error.message,
			} );
		}

		setIsUploading( false );
	};

	return (
		<TabPanelLayout notice={ notice }>
			<DropZone onFilesDrop={ handleDropZone } />
			<VStack className="font-library-modal__local-fonts">
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
						multiple={ true }
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
						'Uploaded fonts appear in your library and can be used in your theme. Supported formats: .tff, .otf, .woff, and .woff2.'
					) }
				</Text>
			</VStack>
		</TabPanelLayout>
	);
}

export default UploadFonts;

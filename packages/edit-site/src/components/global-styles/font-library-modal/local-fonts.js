/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Button,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	DropZone,
	FormFileUpload,
	__experimentalSpacer as Spacer,
	Spinner,
} from '@wordpress/components';
import { file, upload } from '@wordpress/icons';
import { useState, useEffect, useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import TabLayout from './tab-layout';
import { ALLOWED_FILE_EXTENSIONS } from './constants';
import LocalFontVariant from './local-font-variant';
import PreviewContols from './preview-controls';
import { FontLibraryContext } from './context';


function LocalFonts() {
	const { installFonts } = useContext( FontLibraryContext );
	const [ selectedFiles, setSelectedFiles ] = useState( [] );
	const [ fontFacesLoaded, setFontFacesLoaded ] = useState( [] );
	const [ isInstalling, setIsInstalling ] = useState( false );

	const onFilesUpload = ( files ) => {
		let uniqueFilenames = new Set();
		const allowedFiles = [...files].filter((file) => {
			console.log('file', file);
			if(uniqueFilenames.has(file.name)){
				return false; // if name has already been seen, ignore this item
			}
			const fileExtension = file.name.split('.').pop().toLowerCase();
			if ( ALLOWED_FILE_EXTENSIONS.includes( fileExtension ) ) {
				uniqueFilenames.add(file.name); // add name to the set
				return true; // keep the item in the array
			}
			return false; // if not allowed type, ignore this item	
		});
		setSelectedFiles( [...selectedFiles, ...allowedFiles] );
	};

	const onFontFaceLoad = ( face ) => {
		setFontFacesLoaded( ( prevFontFaces ) => [...prevFontFaces, face] );
	}

	useEffect( () => {
		if ( fontFacesLoaded.length ) {
			console.log( 'fontFacesLoaded', fontFacesLoaded );
		}
	}, [ fontFacesLoaded ] );

	const onFontFaceRemove = ( face ) => {
		setSelectedFiles( selectedFiles.filter( ( file ) => ( file.name !== face.file.name )) );
	}

	const handleDropZone = ( files ) => {
		onFilesUpload( files );
	};

	const handleFilesUpload = ( event ) => {
		onFilesUpload( event.target.files );
	};

	const handleInstall = async () => {
		setIsInstalling( !isInstalling );
		// Gets the filenames of the files that are selected (files selected and not deleted by the user using the ui)
		const selectedFilesnames = selectedFiles.map( ( file ) => ( file.name ) );

		// Gets the fontFaces that are selected 
		const fontFaces = fontFacesLoaded.filter( ( face ) => ( selectedFilesnames.includes(face.file.name) ) );

		const formData = new FormData();

		// Creates the fontFamilies array that will be sent to the server
		const fontFamiliesObject  = fontFaces.reduce( (acc, item, i) => {
			if ( !acc[ item.fontFamily ] ) {
				acc[ item.fontFamily ] = {
					name: item.fontFamily,
					fontFamily: item.fontFamily,
					slug: item.fontFamily.replace( /\s+/g, '-' ).toLowerCase(),
					fontFace: [],
				}
			}
			// Add the files to the formData
			formData.append(`files${i}`, item.file, item.file.name);
			// Add the posted file id to the fontFace object
			// This is needed to associate the fontFace with the file on the server
			const face = { ...item, file: `files${i}` };
			acc[ item.fontFamily ]['fontFace'].push( face );
			return acc;
		}, {} );
		const fontFamilies = Object.values( fontFamiliesObject );

		// Adds the fontFamilies to the formData
		formData.append( 'fontFamilies', JSON.stringify( fontFamilies ) );

		// Sends the formData to the server
		const save = await installFonts( formData );
		setIsInstalling( pevIsInstalling => !pevIsInstalling );
		setSelectedFiles( [] );
		setFontFacesLoaded( [] );
	}

	const Footer = () => {
		return (
			<HStack justify="flex-end">
				<Button
					variant="primary"
					isBusy={ isInstalling }
					disabled={ !selectedFiles.length || isInstalling }
					icon={ isInstalling ? <Spinner /> : upload }
					onClick={ handleInstall }
				>
					{ __( 'Upload Fonts' ) }
				</Button>
			</HStack>
		);
	};

	const SelectFilesButton = ( props ) => {
		return (
			<FormFileUpload
				accept="font/*"
				multiple={ true }
				onChange={ handleFilesUpload }
				render={( { openFileDialog } ) => (
					<Button
						onClick={openFileDialog}
						icon={ file }
						variant="secondary"
						text={ __( 'Select font files' ) }
						{ ...props}
					/>
				)}
			/>
		)
	};

	return (
		<TabLayout
			description={ __( 'Drag and drop or select font files here to install' ) }
			footer={ <Footer /> }
		>
			<DropZone onFilesDrop={ handleDropZone } />

			{ selectedFiles.length === 0 && (
				<div className='font-library-modal__upload-area'>
					<SelectFilesButton />
				</div>
			) }

			{ selectedFiles.length > 0 && (
				<>
					<PreviewContols />
					<Spacer margin={8}/>

					<VStack spacing={ 4 }>
						{selectedFiles.map( ( file ) => (
							<LocalFontVariant
								fontFile={ file }
								key={file.name}
								onFontFaceLoad={ onFontFaceLoad }
								onFontFaceRemove={ onFontFaceRemove }
							/>
						))}
					</VStack>

					<Spacer margin={8}/>

					<SelectFilesButton
						text={ __("Add more files...") }
						variant="tertiary"
						icon={ null }
						isSmall
					/>
				</>
			) }
			
		</TabLayout>
	);
}

export default LocalFonts;

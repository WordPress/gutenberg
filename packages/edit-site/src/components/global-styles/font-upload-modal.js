/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	__experimentalSpacer as Spacer,
	__experimentalInputControl as InputControl,
	__experimentalVStack as VStack,
	Button,
	Modal,
	SelectControl,
	FormFileUpload,
	Notice,
} from '@wordpress/components';
import { upload, typography } from '@wordpress/icons';
import { useState } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import { useFontFamilies } from './hooks';

const INITIAL_NEW_FONT_FACE = {
	fontFamily: null,
	fontWeight: null,
	fontStyle: 'normal',
	file: null,
	base64: null,
};

function FontUploadModal( { toggleModalLocalFontOpen } ) {
	const [ fontFace, setFontFace ] = useState( INITIAL_NEW_FONT_FACE );
	const [ notices, setNotices ] = useState( [] );
	const { createSuccessNotice } = useDispatch( noticesStore );
	const { handleAddFontFace } = useFontFamilies();

	function handleFileInputChange( event ) {
		const file = event.target.files[ 0 ];
		setFontFace( ( prevFormData ) => ( {
			...prevFormData,
			file,
		} ) );
		// Create a new FileReader object
		const reader = new FileReader();
		// Set up an event listener to be triggered when the file has been fully loaded
		reader.onloadend = function () {
			// The file's data URL is stored in the result property of the FileReader object
			const fileData = reader.result;
			setFontFace( ( prevFormData ) => ( {
				...prevFormData,
				file,
				base64: fileData,
			} ) );
		};
		// Start reading the file as a data URL
		reader.readAsDataURL( file );
	}

	function validateForm() {
		const isValid = Object.keys( fontFace ).every(
			( key ) => !! fontFace[ key ]
		);
		if ( ! isValid ) {
			setNotices( [
				{ message: __( 'Please fill out all fields.' ), type: 'error' },
			] );
		}
		return isValid;
	}

	function handleChange( fieldName, value ) {
		setFontFace( ( prevFormData ) => ( {
			...prevFormData,
			[ fieldName ]: value || null,
		} ) );
	}

	function handleSubmit( event ) {
		event.preventDefault();
		const isFormValid = validateForm();
		if ( isFormValid ) {
			try {
				handleAddFontFace( fontFace );
				// Display a success notice as snackbar (bottom left component)
				createSuccessNotice( __( 'Font face added succesfully' ), {
					type: 'snackbar',
				} );
				toggleModalLocalFontOpen();
			} catch ( error ) {
				// Display an error notice in the modal
				setNotices( [ { message: error.message, type: 'error' } ] );
			}
		}
	}

	const fontStyleOptions = [
		{
			label: __( 'Normal' ),
			value: 'normal',
		},
		{
			label: __( 'Italic' ),
			value: 'italic',
		},
	];

	return (
		<Modal
			title={ __( 'Upload Local Font' ) }
			onRequestClose={ toggleModalLocalFontOpen }
		>
			<form onSubmit={ handleSubmit }>
				<VStack spacing={ 3 } style={ { alignItems: 'flex-start' } }>
					{ notices.map( ( notice, i ) => (
						<Notice
							style={ { height: '1rem' } }
							status={ notice.type }
							isDismissible={ false }
							key={ `notice-${ i }` }
						>
							<p>{ notice.message }</p>
						</Notice>
					) ) }
					<FormFileUpload
						icon={ fontFace?.file?.name ? typography : upload }
						accept=".ttf, .woff, .woff2"
						required
						onChange={ handleFileInputChange }
						value={ fontFace.file }
						label={ __( 'Font File' ) }
						name="file"
					>
						{ fontFace?.file?.name || __( 'Select Font File' ) }
					</FormFileUpload>
					<InputControl
						label={ __( 'Font Name' ) }
						name="fontFamily"
						placeholder={ __( 'Font Name' ) }
						onChange={ ( value ) =>
							handleChange( 'fontFamily', value )
						}
						value={ fontFace.fontFamily }
					/>
					<SelectControl
						options={ fontStyleOptions }
						label={ __( 'Font Style' ) }
						name="fontStyle"
						onChange={ ( value ) =>
							handleChange( 'fontStyle', value )
						}
						value={ fontFace.fontStyle }
					/>
					<InputControl
						label={ __( 'Font Weight' ) }
						name="fontWeight"
						placeholder={ __( 'Font Weight' ) }
						onChange={ ( value ) =>
							handleChange( 'fontWeight', value )
						}
						value={ fontFace.fontWeight }
					/>
					<Spacer />
					<Button variant="primary" onClick={ handleSubmit }>
						{ __( 'Upload Font' ) }
					</Button>
				</VStack>
			</form>
		</Modal>
	);
}

export default FontUploadModal;

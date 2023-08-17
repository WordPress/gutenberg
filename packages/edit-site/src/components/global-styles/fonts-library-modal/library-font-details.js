/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useContext, useState } from '@wordpress/element';
import {
	Button,
	__experimentalVStack as VStack,
	__experimentalSpacer as Spacer,
	__experimentalText as Text,
	__experimentalConfirmDialog as ConfirmDialog,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import { FontLibraryContext } from './context';
import LibraryFontVariant from './library-font-variant';
import PreviewControls from './preview-controls';

function LibraryFontDetails( { font, handleUnselectFont, canBeRemoved } ) {
	const { uninstallFonts, isFontActivated } =
		useContext( FontLibraryContext );
	const [ isConfirmOpen, setIsConfirmOpen ] = useState( false );

	const fontFaces =
		font.fontFace && font.fontFace.length
			? font.fontFace
			: [
					{
						fontFamily: font.fontFamily,
						fontStyle: 'normal',
						fontWeight: '400',
					},
			  ];

	const handleConfirmUninstall = async () => {
		const result = await uninstallFonts( [ font ] );
		// If the font was succesfully uninstalled it is unselected
		if ( result ) {
			handleUnselectFont();
		}
	};

	const handleUninstallClick = async () => {
		setIsConfirmOpen( true );
	};

	const handleCancelUninstall = () => {
		setIsConfirmOpen( false );
	};

	const isActive = isFontActivated( font.slug );

	return (
		<>
			<ConfirmDialog
				isOpen={ isConfirmOpen }
				cancelButtonText={ __( 'No, keep the font' ) }
				confirmButtonText={ __( 'Yes, uninstall' ) }
				onCancel={ handleCancelUninstall }
				onConfirm={ handleConfirmUninstall }
			>
				{ __(
					`Would you like to remove ${ font.name } and all its variants and assets?`
				) }
			</ConfirmDialog>

			{ /* <PreviewControls /> */ }
			<Spacer margin={ 8 } />

			<VStack spacing={ 4 }>
				<Spacer margin={ 8 } />
				{ fontFaces.map( ( face, i ) => (
					<LibraryFontVariant
						font={ font }
						face={ face }
						key={ `face${ i }` }
					/>
				) ) }
			</VStack>

			<Spacer margin={ 8 } />

			{ ! isActive && !! canBeRemoved && (
				<Button variant="link" onClick={ handleUninstallClick }>
					{ __( 'Delete permanently' ) }
				</Button>
			) }
		</>
	);
}

export default LibraryFontDetails;

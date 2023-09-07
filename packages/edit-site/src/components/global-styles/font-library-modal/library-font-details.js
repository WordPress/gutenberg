/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import {
	__experimentalVStack as VStack,
	__experimentalSpacer as Spacer,
	__experimentalConfirmDialog as ConfirmDialog,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import LibraryFontVariant from './library-font-variant';

function LibraryFontDetails( {
	font,
	isConfirmDeleteOpen,
	handleConfirmUninstall,
	handleCancelUninstall,
} ) {
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

	return (
		<>
			<ConfirmDialog
				isOpen={ isConfirmDeleteOpen }
				cancelButtonText={ __( 'No, keep the font' ) }
				confirmButtonText={ __( 'Yes, uninstall' ) }
				onCancel={ handleCancelUninstall }
				onConfirm={ handleConfirmUninstall }
			>
				{ sprintf(
					/* translators: %s: Name of the font. */
					__(
						'Would you like to remove %s and all its variants and assets?'
					),
					font.name
				) }
			</ConfirmDialog>

			<Spacer margin={ 4 } />

			<VStack spacing={ 0 }>
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
		</>
	);
}

export default LibraryFontDetails;

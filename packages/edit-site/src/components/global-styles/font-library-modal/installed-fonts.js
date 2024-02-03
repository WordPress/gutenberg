/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useContext, useEffect, useState } from '@wordpress/element';
import {
	privateApis as componentsPrivateApis,
	__experimentalHStack as HStack,
	__experimentalSpacer as Spacer,
	Button,
	Spinner,
	FlexItem,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import TabPanelLayout from './tab-panel-layout';
import { FontLibraryContext } from './context';
import FontsGrid from './fonts-grid';
import LibraryFontDetails from './library-font-details';
import LibraryFontCard from './library-font-card';
import ConfirmDeleteDialog from './confirm-delete-dialog';
import { unlock } from '../../../lock-unlock';
const { ProgressBar } = unlock( componentsPrivateApis );

function InstalledFonts() {
	const {
		baseCustomFonts,
		libraryFontSelected,
		baseThemeFonts,
		handleSetLibraryFontSelected,
		refreshLibrary,
		uninstallFontFamily,
		isResolvingLibrary,
		notice,
		setNotice,
	} = useContext( FontLibraryContext );
	const [ isConfirmDeleteOpen, setIsConfirmDeleteOpen ] = useState( false );

	const handleUnselectFont = () => {
		handleSetLibraryFontSelected( null );
	};

	const handleSelectFont = ( font ) => {
		handleSetLibraryFontSelected( font );
	};

	const handleConfirmUninstall = async () => {
		setNotice( null );

		try {
			await uninstallFontFamily( libraryFontSelected );
			setNotice( {
				type: 'success',
				message: __( 'Font family uninstalled successfully.' ),
			} );

			// If the font was succesfully uninstalled it is unselected.
			handleUnselectFont();
			setIsConfirmDeleteOpen( false );
		} catch ( error ) {
			setNotice( {
				type: 'error',
				message:
					__( 'There was an error uninstalling the font family. ' ) +
					error.message,
			} );
		}
	};

	const handleUninstallClick = async () => {
		setIsConfirmDeleteOpen( true );
	};

	const handleCancelUninstall = () => {
		setIsConfirmDeleteOpen( false );
	};

	const tabDescription = !! libraryFontSelected
		? __(
				'Choose font variants. Keep in mind that too many variants could make your site slower.'
		  )
		: null;

	const shouldDisplayDeleteButton =
		!! libraryFontSelected && libraryFontSelected?.source !== 'theme';

	useEffect( () => {
		handleSelectFont( libraryFontSelected );
		refreshLibrary();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );

	return (
		<TabPanelLayout
			title={ libraryFontSelected?.name || '' }
			description={ tabDescription }
			notice={ notice }
			handleBack={ !! libraryFontSelected && handleUnselectFont }
			footer={
				<Footer
					shouldDisplayDeleteButton={ shouldDisplayDeleteButton }
					handleUninstallClick={ handleUninstallClick }
				/>
			}
		>
			<ConfirmDeleteDialog
				font={ libraryFontSelected }
				isConfirmDeleteOpen={ isConfirmDeleteOpen }
				handleConfirmUninstall={ handleConfirmUninstall }
				handleCancelUninstall={ handleCancelUninstall }
			/>

			{ ! libraryFontSelected && (
				<>
					{ isResolvingLibrary && (
						<FlexItem>
							<Spacer margin={ 2 } />
							<Spinner />
							<Spacer margin={ 2 } />
						</FlexItem>
					) }
					{ baseCustomFonts.length > 0 && (
						<>
							<FontsGrid>
								{ baseCustomFonts.map( ( font ) => (
									<LibraryFontCard
										font={ font }
										key={ font.slug }
										onClick={ () => {
											handleSelectFont( font );
										} }
									/>
								) ) }
							</FontsGrid>
							<Spacer margin={ 8 } />
						</>
					) }

					{ baseThemeFonts.length > 0 && (
						<>
							<FontsGrid title={ __( 'Theme Fonts' ) }>
								{ baseThemeFonts.map( ( font ) => (
									<LibraryFontCard
										font={ font }
										key={ font.slug }
										onClick={ () => {
											handleSelectFont( font );
										} }
									/>
								) ) }
							</FontsGrid>
						</>
					) }
				</>
			) }

			{ libraryFontSelected && (
				<LibraryFontDetails
					font={ libraryFontSelected }
					isConfirmDeleteOpen={ isConfirmDeleteOpen }
					handleConfirmUninstall={ handleConfirmUninstall }
					handleCancelUninstall={ handleCancelUninstall }
				/>
			) }
		</TabPanelLayout>
	);
}

function Footer( { shouldDisplayDeleteButton, handleUninstallClick } ) {
	const { saveFontFamilies, fontFamiliesHasChanges, isInstalling } =
		useContext( FontLibraryContext );
	return (
		<HStack justify="flex-end">
			{ isInstalling && <ProgressBar /> }
			<div>
				{ shouldDisplayDeleteButton && (
					<Button
						isDestructive
						variant="tertiary"
						onClick={ handleUninstallClick }
					>
						{ __( 'Delete' ) }
					</Button>
				) }
			</div>
			<Button
				variant="primary"
				onClick={ saveFontFamilies }
				disabled={ ! fontFamiliesHasChanges }
				__experimentalIsFocusable
			>
				{ __( 'Update' ) }
			</Button>
		</HStack>
	);
}

export default InstalledFonts;

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useContext, useEffect, useState } from '@wordpress/element';
import {
	privateApis as componentsPrivateApis,
	__experimentalHStack as HStack,
	__experimentalSpacer as Spacer,
	__experimentalText as Text,
	__experimentalNavigatorProvider as NavigatorProvider,
	__experimentalNavigatorScreen as NavigatorScreen,
	__experimentalNavigatorToParentButton as NavigatorToParentButton,
	__experimentalHeading as Heading,
	Button,
	Spinner,
	FlexItem,
} from '@wordpress/components';
import { chevronLeft } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import TabPanelLayout from './tab-panel-layout';
import { FontLibraryContext } from './context';
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

	const handleConfirmUninstall = async () => {
		setNotice( null );

		try {
			await uninstallFontFamily( libraryFontSelected );
			setNotice( {
				type: 'success',
				message: __( 'Font family uninstalled successfully.' ),
			} );

			// If the font was succesfully uninstalled it is unselected.
			handleSetLibraryFontSelected( null );
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

	const shouldDisplayDeleteButton =
		!! libraryFontSelected && libraryFontSelected?.source !== 'theme';

	useEffect( () => {
		handleSetLibraryFontSelected( libraryFontSelected );
		refreshLibrary();
	}, [] );

	return (
		<TabPanelLayout
			notice={ notice }
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

			{ isResolvingLibrary && (
				<FlexItem>
					<Spacer margin={ 2 } />
					<Spinner />
					<Spacer margin={ 2 } />
				</FlexItem>
			) }

			<NavigatorProvider initialPath="/">
				<NavigatorScreen path="/">
					{ baseCustomFonts.length > 0 && (
						<>
							<Text className="font-library-modal__subtitle">
								{ __( 'Installed Fonts' ) }
							</Text>

							<Spacer margin={ 2 } />

							{ baseCustomFonts.map( ( font ) => (
								<LibraryFontCard
									font={ font }
									key={ font.slug }
									onClick={ () => {
										handleSetLibraryFontSelected( font );
									} }
								/>
							) ) }
							<Spacer margin={ 8 } />
						</>
					) }

					{ baseThemeFonts.length > 0 && (
						<>
							<Text className="font-library-modal__subtitle">
								{ __( 'Theme Fonts' ) }
							</Text>

							<Spacer margin={ 2 } />

							{ baseThemeFonts.map( ( font ) => (
								<LibraryFontCard
									font={ font }
									key={ font.slug }
									onClick={ () => {
										handleSetLibraryFontSelected( font );
									} }
								/>
							) ) }
						</>
					) }
					<Spacer margin={ 16 } />
				</NavigatorScreen>

				<NavigatorScreen path="/fontFamily">
					<HStack spacing={ 2 } aligh="left">
						<NavigatorToParentButton
							icon={ chevronLeft }
							isSmall
							aria-label={ __( 'Navigate to the previous view' ) }
						/>

						<Heading level={ 2 } size={ 13 }>
							{ libraryFontSelected?.name }
						</Heading>
					</HStack>
					<Spacer margin={ 4 } />
					<Text>
						{ __(
							'Choose font variants. Keep in mind that too many variants could make your site slower.'
						) }
					</Text>

					<LibraryFontDetails
						font={ libraryFontSelected }
						isConfirmDeleteOpen={ isConfirmDeleteOpen }
						handleConfirmUninstall={ handleConfirmUninstall }
						handleCancelUninstall={ handleCancelUninstall }
					/>
				</NavigatorScreen>
			</NavigatorProvider>
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

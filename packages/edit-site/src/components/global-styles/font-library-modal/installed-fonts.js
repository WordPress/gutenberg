/**
 * WordPress dependencies
 */
import {
	Button,
	__experimentalConfirmDialog as ConfirmDialog,
	__experimentalHStack as HStack,
	__experimentalHeading as Heading,
	__experimentalNavigatorProvider as NavigatorProvider,
	__experimentalNavigatorScreen as NavigatorScreen,
	__experimentalNavigatorToParentButton as NavigatorToParentButton,
	__experimentalUseNavigator as useNavigator,
	__experimentalSpacer as Spacer,
	__experimentalText as Text,
	__experimentalVStack as VStack,
	Flex,
	Notice,
	Spinner,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { useContext, useEffect, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { chevronLeft } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { unlock } from '../../../lock-unlock';
import { FontLibraryContext } from './context';
import FontCard from './font-card';
import LibraryFontVariant from './library-font-variant';
import { sortFontFaces } from './utils/sort-font-faces';
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
		isInstalling,
		saveFontFamilies,
		getFontFacesActivated,
		fontFamiliesHasChanges,
		notice,
		setNotice,
	} = useContext( FontLibraryContext );
	const [ isConfirmDeleteOpen, setIsConfirmDeleteOpen ] = useState( false );

	const shouldDisplayDeleteButton =
		!! libraryFontSelected && libraryFontSelected?.source !== 'theme';

	const handleUninstallClick = () => {
		setIsConfirmDeleteOpen( true );
	};

	const getFontFacesToDisplay = ( font ) => {
		if ( ! font ) {
			return [];
		}
		if ( ! font.fontFace || ! font.fontFace.length ) {
			return [
				{
					fontFamily: font.fontFamily,
					fontStyle: 'normal',
					fontWeight: '400',
				},
			];
		}
		return sortFontFaces( font.fontFace );
	};

	const getFontCardVariantsText = ( font ) => {
		const variantsInstalled =
			font?.fontFace?.length > 0 ? font.fontFace.length : 1;
		const variantsActive = getFontFacesActivated(
			font.slug,
			font.source
		).length;
		return sprintf(
			/* translators: 1: Active font variants, 2: Total font variants. */
			__( '%1$s/%2$s variants active' ),
			variantsActive,
			variantsInstalled
		);
	};

	useEffect( () => {
		handleSetLibraryFontSelected( libraryFontSelected );
		refreshLibrary();
	}, [] );

	return (
		<div className="font-library-modal__tabpanel-layout">
			{ isResolvingLibrary && (
				<HStack align="center">
					<Spacer />
					<Spinner />
					<Spacer />
				</HStack>
			) }

			<NavigatorProvider initialPath="/">
				<NavigatorScreen path="/">
					{ notice && (
						<>
							<Spacer margin={ 1 } />
							<Notice
								status={ notice.type }
								onRemove={ () => setNotice( null ) }
							>
								{ notice.message }
							</Notice>
							<Spacer margin={ 1 } />
						</>
					) }
					{ baseCustomFonts.length > 0 && (
						<>
							<Text className="font-library-modal__subtitle">
								{ __( 'Installed Fonts' ) }
							</Text>
							<Spacer margin={ 2 } />
							{ baseCustomFonts.map( ( font ) => (
								<FontCard
									font={ font }
									key={ font.slug }
									navigatorPath={ '/fontFamily' }
									variantsText={ getFontCardVariantsText(
										font
									) }
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
								<FontCard
									font={ font }
									key={ font.slug }
									navigatorPath={ '/fontFamily' }
									variantsText={ getFontCardVariantsText(
										font
									) }
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
					<ConfirmDeleteDialog
						font={ libraryFontSelected }
						isOpen={ isConfirmDeleteOpen }
						setIsOpen={ setIsConfirmDeleteOpen }
						setNotice={ setNotice }
						uninstallFontFamily={ uninstallFontFamily }
						handleSetLibraryFontSelected={
							handleSetLibraryFontSelected
						}
					/>

					<Flex justify="flex-start">
						<NavigatorToParentButton
							icon={ chevronLeft }
							isSmall
							onClick={ () => {
								handleSetLibraryFontSelected( null );
							} }
							aria-label={ __( 'Navigate to the previous view' ) }
						/>
						<Heading
							level={ 2 }
							size={ 13 }
							className="edit-site-global-styles-header"
						>
							{ libraryFontSelected?.name }
						</Heading>
					</Flex>
					{ notice && (
						<>
							<Spacer margin={ 1 } />
							<Notice
								status={ notice.type }
								onRemove={ () => setNotice( null ) }
							>
								{ notice.message }
							</Notice>
							<Spacer margin={ 1 } />
						</>
					) }
					<Spacer margin={ 4 } />
					<Text>
						{ __(
							'Choose font variants. Keep in mind that too many variants could make your site slower.'
						) }
					</Text>
					<Spacer margin={ 4 } />
					<VStack spacing={ 0 }>
						<Spacer margin={ 8 } />
						{ getFontFacesToDisplay( libraryFontSelected ).map(
							( face, i ) => (
								<LibraryFontVariant
									font={ libraryFontSelected }
									face={ face }
									key={ `face${ i }` }
								/>
							)
						) }
					</VStack>
				</NavigatorScreen>
			</NavigatorProvider>

			<HStack
				justify="flex-end"
				className="font-library-modal__tabpanel-layout__footer"
			>
				{ isInstalling && <ProgressBar /> }
				{ shouldDisplayDeleteButton && (
					<Button
						isDestructive
						variant="tertiary"
						onClick={ handleUninstallClick }
					>
						{ __( 'Delete' ) }
					</Button>
				) }
				<Button
					variant="primary"
					onClick={ saveFontFamilies }
					disabled={ ! fontFamiliesHasChanges }
					__experimentalIsFocusable
				>
					{ __( 'Update' ) }
				</Button>
			</HStack>
		</div>
	);
}

function ConfirmDeleteDialog( {
	font,
	isOpen,
	setIsOpen,
	setNotice,
	uninstallFontFamily,
	handleSetLibraryFontSelected,
} ) {
	const navigator = useNavigator();

	const handleConfirmUninstall = async () => {
		setNotice( null );
		setIsOpen( false );
		try {
			await uninstallFontFamily( font );
			navigator.goBack();
			handleSetLibraryFontSelected( null );
			setNotice( {
				type: 'success',
				message: __( 'Font family uninstalled successfully.' ),
			} );
		} catch ( error ) {
			setNotice( {
				type: 'error',
				message:
					__( 'There was an error uninstalling the font family. ' ) +
					error.message,
			} );
		}
	};

	const handleCancelUninstall = () => {
		setIsOpen( false );
	};

	return (
		<ConfirmDialog
			isOpen={ isOpen }
			cancelButtonText={ __( 'Cancel' ) }
			confirmButtonText={ __( 'Delete' ) }
			onCancel={ handleCancelUninstall }
			onConfirm={ handleConfirmUninstall }
		>
			{ font &&
				sprintf(
					/* translators: %s: Name of the font. */
					__(
						'Are you sure you want to delete "%s" font and all its variants and assets?'
					),
					font.name
				) }
		</ConfirmDialog>
	);
}

export default InstalledFonts;

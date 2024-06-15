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
	ProgressBar,
} from '@wordpress/components';
import { useEntityRecord, store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useContext, useEffect, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { chevronLeft } from '@wordpress/icons';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { FontLibraryContext } from './context';
import FontCard from './font-card';
import LibraryFontVariant from './library-font-variant';
import { sortFontFaces } from './utils/sort-font-faces';
import { setUIValuesNeeded } from './utils';
import { unlock } from '../../../lock-unlock';

const { useGlobalSetting } = unlock( blockEditorPrivateApis );

function InstalledFonts() {
	const {
		baseCustomFonts,
		libraryFontSelected,
		handleSetLibraryFontSelected,
		refreshLibrary,
		uninstallFontFamily,
		isResolvingLibrary,
		isInstalling,
		saveFontFamilies,
		getFontFacesActivated,
		notice,
		setNotice,
		fontFamilies,
	} = useContext( FontLibraryContext );
	const [ isConfirmDeleteOpen, setIsConfirmDeleteOpen ] = useState( false );
	const [ baseFontFamilies ] = useGlobalSetting(
		'typography.fontFamilies',
		undefined,
		'base'
	);
	const globalStylesId = useSelect( ( select ) => {
		const { __experimentalGetCurrentGlobalStylesId } = select( coreStore );
		return __experimentalGetCurrentGlobalStylesId();
	} );

	const globalStyles = useEntityRecord(
		'root',
		'globalStyles',
		globalStylesId
	);
	const fontFamiliesHasChanges =
		!! globalStyles?.edits?.settings?.typography?.fontFamilies;

	const themeFonts = fontFamilies?.theme
		? fontFamilies.theme
				.map( ( f ) => setUIValuesNeeded( f, { source: 'theme' } ) )
				.sort( ( a, b ) => a.name.localeCompare( b.name ) )
		: [];
	const themeFontsSlugs = new Set( themeFonts.map( ( f ) => f.slug ) );
	const baseThemeFonts = baseFontFamilies?.theme
		? themeFonts.concat(
				baseFontFamilies.theme
					.filter( ( f ) => ! themeFontsSlugs.has( f.slug ) )
					.map( ( f ) => setUIValuesNeeded( f, { source: 'theme' } ) )
					.sort( ( a, b ) => a.name.localeCompare( b.name ) )
		  )
		: [];

	const customFontFamilyId =
		libraryFontSelected?.source === 'custom' && libraryFontSelected?.id;

	const canUserDelete = useSelect(
		( select ) => {
			const { canUser } = select( coreStore );
			return (
				customFontFamilyId &&
				canUser( 'delete', 'font-families', customFontFamilyId )
			);
		},
		[ customFontFamilyId ]
	);

	const shouldDisplayDeleteButton =
		!! libraryFontSelected &&
		libraryFontSelected?.source !== 'theme' &&
		canUserDelete;

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
				<div className="font-library-modal__loading">
					<ProgressBar />
				</div>
			) }

			{ ! isResolvingLibrary && (
				<>
					<NavigatorProvider
						initialPath={
							libraryFontSelected ? '/fontFamily' : '/'
						}
					>
						<NavigatorScreen path="/">
							<VStack spacing="8">
								{ notice && (
									<Notice
										status={ notice.type }
										onRemove={ () => setNotice( null ) }
									>
										{ notice.message }
									</Notice>
								) }
								{ baseCustomFonts.length > 0 && (
									<VStack>
										<h2 className="font-library-modal__fonts-title">
											{ __( 'Installed Fonts' ) }
										</h2>
										{ /*
										 * Disable reason: The `list` ARIA role is redundant but
										 * Safari+VoiceOver won't announce the list otherwise.
										 */
										/* eslint-disable jsx-a11y/no-redundant-roles */ }
										<ul
											role="list"
											className="font-library-modal__fonts-list"
										>
											{ baseCustomFonts.map( ( font ) => (
												<li
													key={ font.slug }
													className="font-library-modal__fonts-list-item"
												>
													<FontCard
														font={ font }
														navigatorPath="/fontFamily"
														variantsText={ getFontCardVariantsText(
															font
														) }
														onClick={ () => {
															handleSetLibraryFontSelected(
																font
															);
														} }
													/>
												</li>
											) ) }
										</ul>
										{ /* eslint-enable jsx-a11y/no-redundant-roles */ }
									</VStack>
								) }
								{ baseThemeFonts.length > 0 && (
									<VStack>
										<h2 className="font-library-modal__fonts-title">
											{ __( 'Theme Fonts' ) }
										</h2>
										{ /*
										 * Disable reason: The `list` ARIA role is redundant but
										 * Safari+VoiceOver won't announce the list otherwise.
										 */
										/* eslint-disable jsx-a11y/no-redundant-roles */ }
										<ul
											role="list"
											className="font-library-modal__fonts-list"
										>
											{ baseThemeFonts.map( ( font ) => (
												<li
													key={ font.slug }
													className="font-library-modal__fonts-list-item"
												>
													<FontCard
														font={ font }
														navigatorPath="/fontFamily"
														variantsText={ getFontCardVariantsText(
															font
														) }
														onClick={ () => {
															handleSetLibraryFontSelected(
																font
															);
														} }
													/>
												</li>
											) ) }
										</ul>
										{ /* eslint-enable jsx-a11y/no-redundant-roles */ }
									</VStack>
								) }
							</VStack>
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
									size="small"
									onClick={ () => {
										handleSetLibraryFontSelected( null );
									} }
									label={ __( 'Back' ) }
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
								{ getFontFacesToDisplay(
									libraryFontSelected
								).map( ( face, i ) => (
									<LibraryFontVariant
										font={ libraryFontSelected }
										face={ face }
										key={ `face${ i }` }
									/>
								) ) }
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
							onClick={ () => {
								saveFontFamilies( fontFamilies );
							} }
							disabled={ ! fontFamiliesHasChanges }
							__experimentalIsFocusable
						>
							{ __( 'Update' ) }
						</Button>
					</HStack>
				</>
			) }
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

/**
 * WordPress dependencies
 */
import {
	Button,
	__experimentalConfirmDialog as ConfirmDialog,
	__experimentalHStack as HStack,
	__experimentalHeading as Heading,
	Navigator,
	useNavigator,
	__experimentalSpacer as Spacer,
	__experimentalText as Text,
	__experimentalVStack as VStack,
	Flex,
	Notice,
	ProgressBar,
	CheckboxControl,
} from '@wordpress/components';
import { useEntityRecord, store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useContext, useEffect, useState } from '@wordpress/element';
import { __, _x, sprintf, isRTL } from '@wordpress/i18n';
import { chevronLeft, chevronRight } from '@wordpress/icons';
import type {
	FontFamilyPreset,
	GlobalStylesConfig,
} from '@wordpress/global-styles-engine';
import type { FontFamily } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { FontLibraryContext } from './context';
import FontCard from './font-card';
import LibraryFontVariant from './library-font-variant';
import { sortFontFaces } from './utils/sort-font-faces';
import {
	setUIValuesNeeded,
	loadFontFaceInBrowser,
	unloadFontFaceInBrowser,
	getDisplaySrcFromFontFace,
} from './utils';
import { useSetting } from '../hooks';

function InstalledFonts() {
	const {
		baseCustomFonts,
		libraryFontSelected,
		handleSetLibraryFontSelected,
		uninstallFontFamily,
		isResolvingLibrary,
		isInstalling,
		saveFontFamilies,
		getFontFacesActivated,
	} = useContext( FontLibraryContext );

	const [ fontFamilies, setFontFamilies ] = useSetting<
		Record< string, FontFamilyPreset[] > | undefined
	>( 'typography.fontFamilies' );
	const [ isConfirmDeleteOpen, setIsConfirmDeleteOpen ] =
		useState< boolean >( false );
	const [ notice, setNotice ] = useState< {
		type: 'success' | 'error' | 'info';
		message: string;
	} | null >( null );
	const [ baseFontFamilies ] = useSetting<
		Record< string, FontFamilyPreset[] > | undefined
	>( 'typography.fontFamilies', undefined, 'base' );
	const globalStylesId = useSelect( ( select ) => {
		const { __experimentalGetCurrentGlobalStylesId } = select( coreStore );
		return __experimentalGetCurrentGlobalStylesId();
	}, [] );
	const globalStyles = useEntityRecord< GlobalStylesConfig >(
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
				canUser( 'delete', {
					kind: 'postType',
					name: 'wp_font_family',
					id: customFontFamilyId,
				} )
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

	const handleUpdate = async () => {
		setNotice( null );
		try {
			await saveFontFamilies( fontFamilies );
			setNotice( {
				type: 'success',
				message: __( 'Font family updated successfully.' ),
			} );
		} catch ( error ) {
			setNotice( {
				type: 'error',
				message: sprintf(
					/* translators: %s: error message */
					__( 'There was an error updating the font family. %s' ),
					( error as Error ).message
				),
			} );
		}
	};

	const getFontFacesToDisplay = ( font: FontFamily ) => {
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

	const getFontCardVariantsText = ( font: FontFamily ) => {
		const variantsInstalled =
			font?.fontFace && ( font?.fontFace?.length ?? 0 ) > 0
				? font.fontFace.length
				: 1;
		const variantsActive = getFontFacesActivated(
			font.slug,
			font.source
		).length;
		return sprintf(
			/* translators: 1: Active font variants, 2: Total font variants. */
			__( '%1$d/%2$d variants active' ),
			variantsActive,
			variantsInstalled
		);
	};

	useEffect( () => {
		handleSetLibraryFontSelected( libraryFontSelected );
	}, [] );

	// Get activated fonts count.
	const activeFontsCount = libraryFontSelected
		? getFontFacesActivated(
				libraryFontSelected.slug,
				libraryFontSelected.source
		  ).length
		: 0;

	const selectedFontsCount =
		libraryFontSelected?.fontFace?.length ??
		( libraryFontSelected?.fontFamily ? 1 : 0 );

	// Check if any fonts are selected.
	const isIndeterminate =
		activeFontsCount > 0 && activeFontsCount !== selectedFontsCount;

	// Check if all fonts are selected.
	const isSelectAllChecked = activeFontsCount === selectedFontsCount;

	// Toggle select all fonts.
	const toggleSelectAll = () => {
		if ( ! libraryFontSelected || ! libraryFontSelected?.source ) {
			return;
		}
		const initialFonts =
			fontFamilies?.[ libraryFontSelected.source ]?.filter(
				( f ) => f.slug !== libraryFontSelected.slug
			) ?? [];
		const newFonts = isSelectAllChecked
			? initialFonts
			: [ ...initialFonts, libraryFontSelected ];

		setFontFamilies( {
			...fontFamilies,
			[ libraryFontSelected.source ]: newFonts,
		} );

		if ( libraryFontSelected.fontFace ) {
			libraryFontSelected.fontFace.forEach( ( face ) => {
				if ( isSelectAllChecked ) {
					unloadFontFaceInBrowser( face, 'all' );
				} else {
					const displaySrc = getDisplaySrcFromFontFace(
						face?.src ?? ''
					);
					if ( displaySrc ) {
						loadFontFaceInBrowser( face, displaySrc, 'all' );
					}
				}
			} );
		}
	};

	const hasFonts = baseThemeFonts.length > 0 || baseCustomFonts.length > 0;
	return (
		<div className="font-library-modal__tabpanel-layout">
			{ isResolvingLibrary && (
				<div className="font-library-modal__loading">
					<ProgressBar />
				</div>
			) }

			{ ! isResolvingLibrary && (
				<>
					<Navigator
						initialPath={
							libraryFontSelected ? '/fontFamily' : '/'
						}
					>
						<Navigator.Screen path="/">
							<VStack spacing="8">
								{ notice && (
									<Notice
										status={ notice.type }
										onRemove={ () => setNotice( null ) }
									>
										{ notice.message }
									</Notice>
								) }
								{ ! hasFonts && (
									<Text as="p">
										{ __( 'No fonts installed.' ) }
									</Text>
								) }
								{ baseThemeFonts.length > 0 && (
									<VStack>
										<h2 className="font-library-modal__fonts-title">
											{
												/* translators: Heading for a list of fonts provided by the theme. */
												_x( 'Theme', 'font source' )
											}
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
															setNotice( null );
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
								{ baseCustomFonts.length > 0 && (
									<VStack>
										<h2 className="font-library-modal__fonts-title">
											{
												/* translators: Heading for a list of fonts installed by the user. */
												_x( 'Custom', 'font source' )
											}
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
															setNotice( null );
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
						</Navigator.Screen>

						<Navigator.Screen path="/fontFamily">
							{ libraryFontSelected && (
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
							) }

							<Flex justify="flex-start">
								<Navigator.BackButton
									icon={
										isRTL() ? chevronRight : chevronLeft
									}
									size="small"
									onClick={ () => {
										handleSetLibraryFontSelected(
											undefined
										);
										setNotice( null );
									} }
									label={ __( 'Back' ) }
								/>
								<Heading
									level={ 2 }
									size={ 13 }
									className="global-styles-ui-header"
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
								<CheckboxControl
									className="font-library-modal__select-all"
									label={ __( 'Select all' ) }
									checked={ isSelectAllChecked }
									onChange={ toggleSelectAll }
									indeterminate={ isIndeterminate }
									__nextHasNoMarginBottom
								/>
								<Spacer margin={ 8 } />
								{ /*
								 * Disable reason: The `list` ARIA role is redundant but
								 * Safari+VoiceOver won't announce the list otherwise.
								 */
								/* eslint-disable jsx-a11y/no-redundant-roles */ }
								<ul
									role="list"
									className="font-library-modal__fonts-list"
								>
									{ libraryFontSelected &&
										getFontFacesToDisplay(
											libraryFontSelected
										).map( ( face, i ) => (
											<li
												key={ `face${ i }` }
												className="font-library-modal__fonts-list-item"
											>
												<LibraryFontVariant
													font={ libraryFontSelected }
													face={ face }
													key={ `face${ i }` }
												/>
											</li>
										) ) }
								</ul>
								{ /* eslint-enable jsx-a11y/no-redundant-roles */ }
							</VStack>
						</Navigator.Screen>
					</Navigator>

					<HStack
						justify="flex-end"
						className="font-library-modal__footer"
					>
						{ isInstalling && <ProgressBar /> }
						{ shouldDisplayDeleteButton && (
							<Button
								__next40pxDefaultSize
								isDestructive
								variant="tertiary"
								onClick={ handleUninstallClick }
							>
								{ __( 'Delete' ) }
							</Button>
						) }
						<Button
							__next40pxDefaultSize
							variant="primary"
							onClick={ handleUpdate }
							disabled={ ! fontFamiliesHasChanges }
							accessibleWhenDisabled
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
}: {
	font: FontFamily;
	isOpen: boolean;
	setIsOpen: ( isOpen: boolean ) => void;
	setNotice: (
		notice: {
			type: 'success' | 'error' | 'info';
			message: string;
		} | null
	) => void;
	uninstallFontFamily: (
		fontFamily: FontFamily
	) => Promise< { deleted: boolean } >;
	handleSetLibraryFontSelected: ( font?: FontFamily ) => void;
} ) {
	const navigator = useNavigator();

	const handleConfirmUninstall = async () => {
		setNotice( null );
		setIsOpen( false );
		try {
			await uninstallFontFamily( font );
			navigator.goBack();
			handleSetLibraryFontSelected( undefined );
			setNotice( {
				type: 'success',
				message: __( 'Font family uninstalled successfully.' ),
			} );
		} catch ( error ) {
			setNotice( {
				type: 'error',
				message:
					__( 'There was an error uninstalling the font family.' ) +
					( error as Error ).message,
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
			size="medium"
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

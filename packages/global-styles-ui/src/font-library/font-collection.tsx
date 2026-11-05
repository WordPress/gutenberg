import { useContext, useEffect, useState, useMemo } from '@wordpress/element';
import {
	__experimentalSpacer as Spacer,
	__experimentalText as WCText,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	Navigator,
	__experimentalHeading as Heading,
	Notice as WCNotice,
	SelectControl as WCSelectControl,
	Flex,
	Button,
	SearchControl,
	CheckboxControl as WCCheckboxControl,
} from '@wordpress/components';
import {
	// eslint-disable-next-line @wordpress/use-recommended-components -- Intentional early adoption of the new Menu, pending WordPress/gutenberg#76135.
	Menu,
	Progress,
} from '@wordpress/ui';
import { debounce } from '@wordpress/compose';
import { __, _x, isRTL } from '@wordpress/i18n';
import { moreVertical, chevronLeft, chevronRight } from '@wordpress/icons';
import { useEntityRecord } from '@wordpress/core-data';
import type {
	FontCollection as FontCollectionType,
	FontFace,
	FontFamily,
	CollectionFontFamily,
} from '@wordpress/core-data';
import { FontLibraryContext } from './context';
import FontCard from './font-card';
import Pagination, { getFontsPerPage } from './pagination';
import filterFonts from './utils/filter-fonts';
import { toggleFont } from './utils/toggleFont';
import {
	getFontsOutline,
	isFontFontFaceInOutline,
} from './utils/fonts-outline';
import GoogleFontsConfirmDialog from './google-fonts-confirm-dialog';
import { downloadFontFaceAssets } from './utils';
import { sortFontFaces } from './utils/sort-font-faces';
import CollectionFontVariant from './collection-font-variant';
import type { FontFamilyToUpload } from './types';

const DEFAULT_CATEGORY = {
	slug: 'all',
	name: _x( 'All', 'font categories' ),
};

const LOCAL_STORAGE_ITEM = 'wp-font-library-google-fonts-permission';

function FontCollection( { slug }: { slug: string } ) {
	const requiresPermission = slug === 'google-fonts';

	const getGoogleFontsPermissionFromStorage = () => {
		return window.localStorage.getItem( LOCAL_STORAGE_ITEM ) === 'true';
	};

	const [ selectedFont, setSelectedFont ] = useState< FontFamily | null >(
		null
	);
	const [ lastSelectedFontSlug, setLastSelectedFontSlug ] = useState<
		string | undefined
	>( undefined );
	const [ notice, setNotice ] = useState< {
		type: 'success' | 'error' | 'info';
		message: string;
	} | null >( null );
	const [ fontsToInstall, setFontsToInstall ] = useState< FontFamily[] >(
		[]
	);
	const [ page, setPage ] = useState( 1 );
	const [ filters, setFilters ] = useState< {
		category?: string;
		search?: string;
	} >( {} );
	const [ renderConfirmDialog, setRenderConfirmDialog ] = useState(
		requiresPermission && ! getGoogleFontsPermissionFromStorage()
	);
	const { installFonts, isInstalling, baseCustomFonts } =
		useContext( FontLibraryContext );
	const { record: selectedCollection, isResolving: isLoading } =
		useEntityRecord< FontCollectionType >( 'root', 'fontCollection', slug );

	useEffect( () => {
		const handleStorage = () => {
			setRenderConfirmDialog(
				requiresPermission && ! getGoogleFontsPermissionFromStorage()
			);
		};
		handleStorage();
		window.addEventListener( 'storage', handleStorage );
		return () => window.removeEventListener( 'storage', handleStorage );
	}, [ slug, requiresPermission ] );

	const revokeAccess = () => {
		window.localStorage.setItem( LOCAL_STORAGE_ITEM, 'false' );
		window.dispatchEvent( new Event( 'storage' ) );
	};

	useEffect( () => {
		setSelectedFont( null );
	}, [ slug ] );

	useEffect( () => {
		// If the selected fonts change, reset the selected fonts to install
		setFontsToInstall( [] );
	}, [ selectedFont ] );

	const collectionFonts = useMemo(
		() =>
			( selectedCollection?.font_families as
				CollectionFontFamily[] | undefined ) ?? [],
		[ selectedCollection ]
	);
	const collectionCategories = selectedCollection?.categories ?? [];

	const categories = [ DEFAULT_CATEGORY, ...collectionCategories ];

	const fonts = useMemo(
		() => filterFonts( collectionFonts, filters ),
		[ collectionFonts, filters ]
	);

	const pageSize = getFontsPerPage();
	const totalPages = Math.ceil( fonts.length / pageSize );
	const itemsStart = ( page - 1 ) * pageSize;
	const itemsLimit = page * pageSize;
	const items = fonts.slice( itemsStart, itemsLimit );

	const handleCategoryFilter = ( category: string ) => {
		setFilters( { ...filters, category } );
		setPage( 1 );
	};

	const handleUpdateSearchInput = ( value: string ) => {
		setFilters( { ...filters, search: value } );
		setPage( 1 );
	};

	const debouncedUpdateSearchInput = debounce(
		// @ts-expect-error `debounce` expects a `(...args: unknown[]) => unknown` callback.
		handleUpdateSearchInput,
		300
	);

	const handleToggleVariant = ( font: FontFamily, face?: FontFace ) => {
		const newFontsToInstall = toggleFont( font, face, fontsToInstall );
		setFontsToInstall( newFontsToInstall );
	};

	const fontToInstallOutline = getFontsOutline( fontsToInstall );
	const installedFontsOutline = getFontsOutline( baseCustomFonts );

	const isFontFaceInstalled = ( face: FontFace ) =>
		!! selectedFont &&
		isFontFontFaceInOutline(
			selectedFont.slug,
			selectedFont.fontFace ? face : null, // If the font has no fontFace, we want to check if the font is installed
			installedFontsOutline
		);

	const installableFontFaces = selectedFont?.fontFace?.filter(
		( face ) => ! isFontFaceInstalled( face )
	);

	const isAllInstalled =
		!! selectedFont &&
		( selectedFont.fontFace?.length
			? installableFontFaces?.length === 0
			: isFontFontFaceInOutline(
					selectedFont.slug,
					null,
					installedFontsOutline
				) );

	const resetFontsToInstall = () => {
		setFontsToInstall( [] );
	};

	const selectFontCount =
		fontsToInstall.length > 0
			? ( fontsToInstall[ 0 ]?.fontFace?.length ?? 0 )
			: 0;

	// Check if any fonts are selected.
	const isIndeterminate =
		selectFontCount > 0 && selectFontCount !== installableFontFaces?.length;

	// Check if all installable fonts are selected.
	const isSelectAllChecked = selectFontCount === installableFontFaces?.length;

	// Toggle select all fonts.
	const toggleSelectAll = () => {
		const newFonts: FontFamily[] = [];
		if ( ! isSelectAllChecked && selectedFont ) {
			newFonts.push(
				selectedFont.fontFace
					? { ...selectedFont, fontFace: installableFontFaces }
					: selectedFont
			);
		}

		setFontsToInstall( newFonts );
	};

	const handleInstall = async () => {
		setNotice( null );

		const fontFamily: FontFamilyToUpload = fontsToInstall[ 0 ];

		try {
			if ( fontFamily?.fontFace ) {
				await Promise.all(
					fontFamily.fontFace.map( async ( fontFace ) => {
						if ( fontFace.src ) {
							fontFace.file = await downloadFontFaceAssets(
								fontFace.src
							);
						}
					} )
				);
			}
		} catch {
			// If any of the fonts fail to download,
			// show an error notice and stop the request from being sent.
			setNotice( {
				type: 'error',
				message: __(
					'Error installing the fonts, could not be downloaded.'
				),
			} );
			return;
		}

		try {
			await installFonts( [ fontFamily ] );
			setNotice( {
				type: 'success',
				message: __( 'Fonts were installed successfully.' ),
			} );
		} catch ( error ) {
			setNotice( {
				type: 'error',
				message: ( error as Error ).message,
			} );
		}
		resetFontsToInstall();
	};

	const getSortedFontFaces = ( fontFamily: FontFamily ) => {
		if ( ! fontFamily ) {
			return [];
		}
		if ( ! fontFamily.fontFace || ! fontFamily.fontFace.length ) {
			return [
				{
					fontFamily: fontFamily.fontFamily,
					fontStyle: 'normal',
					fontWeight: '400',
				},
			];
		}
		return sortFontFaces( fontFamily.fontFace );
	};

	if ( renderConfirmDialog ) {
		return <GoogleFontsConfirmDialog />;
	}

	const showActions =
		slug === 'google-fonts' && ! renderConfirmDialog && ! selectedFont;

	return (
		<div className="font-library__tabpanel-layout">
			{ isLoading && (
				<div className="font-library__loading">
					<Progress.Root
						value={ null }
						aria-label={ __( 'Loading fonts' ) }
					>
						<Progress.Track>
							<Progress.Indicator />
						</Progress.Track>
					</Progress.Root>
				</div>
			) }
			{ ! isLoading && selectedCollection && (
				<>
					<Navigator
						initialPath="/"
						className="font-library__tabpanel-layout"
					>
						<Navigator.Screen path="/">
							<HStack justify="space-between">
								<VStack>
									<Heading level={ 2 } size={ 13 }>
										{ selectedCollection.name }
									</Heading>
									<WCText>
										{ selectedCollection.description }
									</WCText>
								</VStack>
								{ showActions && (
									<Menu.Root>
										<Menu.Trigger
											render={
												<Button
													size="small"
													icon={ moreVertical }
													label={ __( 'Actions' ) }
												/>
											}
										/>
										<Menu.Popup
											positioner={
												<Menu.Positioner
													side="bottom"
													align="end"
												/>
											}
										>
											<Menu.Item onClick={ revokeAccess }>
												<Menu.ItemLabel>
													{ __(
														'Revoke access to Google Fonts'
													) }
												</Menu.ItemLabel>
											</Menu.Item>
										</Menu.Popup>
									</Menu.Root>
								) }
							</HStack>
							<Spacer margin={ 4 } />
							<HStack spacing={ 4 } justify="space-between">
								<SearchControl
									className="font-library__search"
									value={ filters.search }
									placeholder={ __( 'Font name…' ) }
									label={ __( 'Search' ) }
									onChange={ debouncedUpdateSearchInput }
									hideLabelFromVision={ false }
								/>
								<WCSelectControl
									label={ __( 'Category' ) }
									value={ filters.category }
									onChange={ handleCategoryFilter }
								>
									{ categories &&
										categories.map( ( category ) => (
											<option
												value={ category.slug }
												key={ category.slug }
											>
												{ category.name }
											</option>
										) ) }
								</WCSelectControl>
							</HStack>

							<Spacer margin={ 4 } />

							{ !! selectedCollection?.font_families?.length &&
								! fonts.length && (
									<WCText>
										{ __(
											'No fonts found. Try with a different search term.'
										) }
									</WCText>
								) }

							<div className="font-library__fonts-grid__main">
								{ /*
								 * Disable reason: The `list` ARIA role is redundant but
								 * Safari+VoiceOver won't announce the list otherwise.
								 */
								/* eslint-disable jsx-a11y/no-redundant-roles */ }
								<ul
									role="list"
									className="font-library__fonts-list"
								>
									{ items.map( ( font ) => (
										<li
											key={
												font.font_family_settings.slug
											}
											className="font-library__fonts-list-item"
										>
											<FontCard
												font={
													font.font_family_settings
												}
												navigatorPath="/fontFamily"
												shouldFocus={
													font.font_family_settings
														.slug ===
													lastSelectedFontSlug
												}
												onClick={ () => {
													setSelectedFont(
														font.font_family_settings
													);
												} }
											/>
										</li>
									) ) }
								</ul>
								{ /* eslint-enable jsx-a11y/no-redundant-roles */ }
							</div>
						</Navigator.Screen>

						<Navigator.Screen path="/fontFamily">
							<Flex justify="flex-start">
								<Navigator.BackButton
									icon={
										isRTL() ? chevronRight : chevronLeft
									}
									size="small"
									onClick={ () => {
										setLastSelectedFontSlug(
											selectedFont?.slug
										);
										setSelectedFont( null );
										setNotice( null );
									} }
									label={ __( 'Back' ) }
								/>
								<Heading
									level={ 2 }
									size={ 13 }
									className="global-styles-ui-header"
								>
									{ selectedFont?.name }
								</Heading>
							</Flex>
							{ notice && (
								<>
									<Spacer margin={ 1 } />
									<WCNotice
										status={ notice.type }
										onRemove={ () => setNotice( null ) }
									>
										{ notice.message }
									</WCNotice>
									<Spacer margin={ 1 } />
								</>
							) }
							<Spacer margin={ 4 } />
							<WCText>
								{ __( 'Select font variants to install.' ) }
							</WCText>
							<Spacer margin={ 4 } />
							<WCCheckboxControl
								className="font-library__select-all"
								label={ __( 'Select all' ) }
								checked={ isSelectAllChecked || isAllInstalled }
								onChange={ toggleSelectAll }
								indeterminate={ isIndeterminate }
								disabled={ isAllInstalled }
							/>
							<VStack spacing={ 0 }>
								{ /*
								 * Disable reason: The `list` ARIA role is redundant but
								 * Safari+VoiceOver won't announce the list otherwise.
								 */
								/* eslint-disable jsx-a11y/no-redundant-roles */ }
								<ul
									role="list"
									className="font-library__fonts-list"
								>
									{ selectedFont &&
										getSortedFontFaces( selectedFont ).map(
											( face, i ) => (
												<li
													key={ `face${ i }` }
													className="font-library__fonts-list-item"
												>
													<CollectionFontVariant
														font={ selectedFont }
														face={ face }
														handleToggleVariant={
															handleToggleVariant
														}
														selected={ isFontFontFaceInOutline(
															selectedFont.slug,
															selectedFont.fontFace
																? face
																: null, // If the font has no fontFace, we want to check if the font is in the outline
															fontToInstallOutline
														) }
														installed={ isFontFaceInstalled(
															face
														) }
													/>
												</li>
											)
										) }
								</ul>
								{ /* eslint-enable jsx-a11y/no-redundant-roles */ }
							</VStack>
							<Spacer margin={ 16 } />
						</Navigator.Screen>
					</Navigator>

					{ selectedFont && (
						<Flex
							justify="flex-end"
							className="font-library__footer"
						>
							<Button
								__next40pxDefaultSize
								variant="primary"
								onClick={ handleInstall }
								isBusy={ isInstalling }
								disabled={
									fontsToInstall.length === 0 || isInstalling
								}
								accessibleWhenDisabled
							>
								{ __( 'Install' ) }
							</Button>
						</Flex>
					) }

					{ ! selectedFont && (
						<HStack
							expanded={ false }
							className="font-library__footer"
							justify="end"
							spacing={ 6 }
						>
							<Pagination
								page={ page }
								totalPages={ totalPages }
								onChange={ setPage }
							/>
						</HStack>
					) }
				</>
			) }
		</div>
	);
}

export default FontCollection;

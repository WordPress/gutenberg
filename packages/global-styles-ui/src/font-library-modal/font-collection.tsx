/**
 * WordPress dependencies
 */
import {
	useContext,
	useEffect,
	useState,
	useMemo,
	createInterpolateElement,
} from '@wordpress/element';
import {
	__experimentalSpacer as Spacer,
	__experimentalText as Text,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	Navigator,
	__experimentalHeading as Heading,
	Notice,
	SelectControl,
	Flex,
	Button,
	DropdownMenu,
	SearchControl,
	ProgressBar,
	CheckboxControl,
} from '@wordpress/components';
import { debounce } from '@wordpress/compose';
import { sprintf, __, _x, isRTL } from '@wordpress/i18n';
import {
	moreVertical,
	next,
	previous,
	chevronLeft,
	chevronRight,
} from '@wordpress/icons';
import { useEntityRecord } from '@wordpress/core-data';
import type {
	FontCollection as FontCollectionType,
	FontFace,
	FontFamily,
	CollectionFontFamily,
} from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { FontLibraryContext } from './context';
import FontCard from './font-card';
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
const MIN_WINDOW_HEIGHT = 500;

function FontCollection( { slug }: { slug: string } ) {
	const requiresPermission = slug === 'google-fonts';

	const getGoogleFontsPermissionFromStorage = () => {
		return window.localStorage.getItem( LOCAL_STORAGE_ITEM ) === 'true';
	};

	const [ selectedFont, setSelectedFont ] = useState< FontFamily | null >(
		null
	);
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
	const { installFonts, isInstalling } = useContext( FontLibraryContext );
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
				| CollectionFontFamily[]
				| undefined ) ?? [],
		[ selectedCollection ]
	);
	const collectionCategories = selectedCollection?.categories ?? [];

	const categories = [ DEFAULT_CATEGORY, ...collectionCategories ];

	const fonts = useMemo(
		() => filterFonts( collectionFonts, filters ),
		[ collectionFonts, filters ]
	);

	// NOTE: The height of the font library modal unavailable to use for rendering font family items is roughly 417px
	// The height of each font family item is 61px.
	const windowHeight = Math.max( window.innerHeight, MIN_WINDOW_HEIGHT );
	const pageSize = Math.floor( ( windowHeight - 417 ) / 61 );
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

	// @ts-expect-error
	const debouncedUpdateSearchInput = debounce( handleUpdateSearchInput, 300 );

	const handleToggleVariant = ( font: FontFamily, face?: FontFace ) => {
		const newFontsToInstall = toggleFont( font, face, fontsToInstall );
		setFontsToInstall( newFontsToInstall );
	};

	const fontToInstallOutline = getFontsOutline( fontsToInstall );

	const resetFontsToInstall = () => {
		setFontsToInstall( [] );
	};

	const selectFontCount =
		fontsToInstall.length > 0
			? fontsToInstall[ 0 ]?.fontFace?.length ?? 0
			: 0;

	// Check if any fonts are selected.
	const isIndeterminate =
		selectFontCount > 0 &&
		selectFontCount !== selectedFont?.fontFace?.length;

	// Check if all fonts are selected.
	const isSelectAllChecked =
		selectFontCount === selectedFont?.fontFace?.length;

	// Toggle select all fonts.
	const toggleSelectAll = () => {
		const newFonts: FontFamily[] = [];
		if ( ! isSelectAllChecked && selectedFont ) {
			newFonts.push( selectedFont );
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
		} catch ( error ) {
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

	const ActionsComponent = () => {
		if ( slug !== 'google-fonts' || renderConfirmDialog || selectedFont ) {
			return null;
		}
		return (
			<DropdownMenu
				icon={ moreVertical }
				label={ __( 'Actions' ) }
				popoverProps={ {
					position: 'bottom left',
				} }
				controls={ [
					{
						title: __( 'Revoke access to Google Fonts' ),
						onClick: revokeAccess,
					},
				] }
			/>
		);
	};

	return (
		<div className="font-library-modal__tabpanel-layout">
			{ isLoading && (
				<div className="font-library-modal__loading">
					<ProgressBar />
				</div>
			) }

			{ ! isLoading && selectedCollection && (
				<>
					<Navigator
						initialPath="/"
						className="font-library-modal__tabpanel-layout"
					>
						<Navigator.Screen path="/">
							<HStack justify="space-between">
								<VStack>
									<Heading level={ 2 } size={ 13 }>
										{ selectedCollection.name }
									</Heading>
									<Text>
										{ selectedCollection.description }
									</Text>
								</VStack>
								<ActionsComponent />
							</HStack>
							<Spacer margin={ 4 } />
							<HStack spacing={ 4 } justify="space-between">
								<SearchControl
									value={ filters.search }
									placeholder={ __( 'Font name…' ) }
									label={ __( 'Search' ) }
									onChange={ debouncedUpdateSearchInput }
									__nextHasNoMarginBottom
									hideLabelFromVision={ false }
								/>
								<SelectControl
									__nextHasNoMarginBottom
									__next40pxDefaultSize
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
								</SelectControl>
							</HStack>

							<Spacer margin={ 4 } />

							{ !! selectedCollection?.font_families?.length &&
								! fonts.length && (
									<Text>
										{ __(
											'No fonts found. Try with a different search term.'
										) }
									</Text>
								) }

							<div className="font-library-modal__fonts-grid__main">
								{ /*
								 * Disable reason: The `list` ARIA role is redundant but
								 * Safari+VoiceOver won't announce the list otherwise.
								 */
								/* eslint-disable jsx-a11y/no-redundant-roles */ }
								<ul
									role="list"
									className="font-library-modal__fonts-list"
								>
									{ items.map( ( font ) => (
										<li
											key={
												font.font_family_settings.slug
											}
											className="font-library-modal__fonts-list-item"
										>
											<FontCard
												font={
													font.font_family_settings
												}
												navigatorPath="/fontFamily"
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
								{ __( 'Select font variants to install.' ) }
							</Text>
							<Spacer margin={ 4 } />
							<CheckboxControl
								className="font-library-modal__select-all"
								label={ __( 'Select all' ) }
								checked={ isSelectAllChecked }
								onChange={ toggleSelectAll }
								indeterminate={ isIndeterminate }
								__nextHasNoMarginBottom
							/>
							<VStack spacing={ 0 }>
								{ /*
								 * Disable reason: The `list` ARIA role is redundant but
								 * Safari+VoiceOver won't announce the list otherwise.
								 */
								/* eslint-disable jsx-a11y/no-redundant-roles */ }
								<ul
									role="list"
									className="font-library-modal__fonts-list"
								>
									{ selectedFont &&
										getSortedFontFaces( selectedFont ).map(
											( face, i ) => (
												<li
													key={ `face${ i }` }
													className="font-library-modal__fonts-list-item"
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
							className="font-library-modal__footer"
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
							className="font-library-modal__footer"
							justify="end"
							spacing={ 6 }
						>
							<HStack
								justify="flex-start"
								expanded={ false }
								spacing={ 1 }
								className="font-library-modal__page-selection"
							>
								{ createInterpolateElement(
									sprintf(
										// translators: 1: Current page number, 2: Total number of pages.
										_x(
											'<div>Page</div>%1$s<div>of %2$d</div>',
											'paging'
										),
										'<CurrentPage />',
										totalPages
									),
									{
										div: <div aria-hidden />,
										CurrentPage: (
											<SelectControl
												aria-label={ __(
													'Current page'
												) }
												value={ page.toString() }
												options={ [
													...Array( totalPages ),
												].map( ( e, i ) => {
													return {
														label: (
															i + 1
														).toString(),
														value: (
															i + 1
														).toString(),
													};
												} ) }
												onChange={ ( newPage ) =>
													setPage(
														parseInt( newPage )
													)
												}
												size="small"
												__nextHasNoMarginBottom
												variant="minimal"
											/>
										),
									}
								) }
							</HStack>
							<HStack expanded={ false } spacing={ 1 }>
								<Button
									onClick={ () => setPage( page - 1 ) }
									disabled={ page === 1 }
									accessibleWhenDisabled
									label={ __( 'Previous page' ) }
									icon={ isRTL() ? next : previous }
									showTooltip
									size="compact"
									tooltipPosition="top"
								/>
								<Button
									onClick={ () => setPage( page + 1 ) }
									disabled={ page === totalPages }
									accessibleWhenDisabled
									label={ __( 'Next page' ) }
									icon={ isRTL() ? previous : next }
									showTooltip
									size="compact"
									tooltipPosition="top"
								/>
							</HStack>
						</HStack>
					) }
				</>
			) }
		</div>
	);
}

export default FontCollection;

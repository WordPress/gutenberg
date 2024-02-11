/**
 * WordPress dependencies
 */
import { useContext, useEffect, useState, useMemo } from '@wordpress/element';
import {
	__experimentalSpacer as Spacer,
	__experimentalInputControl as InputControl,
	__experimentalText as Text,
	SelectControl,
	Spinner,
	Icon,
	FlexItem,
	Flex,
	Button,
} from '@wordpress/components';
import { debounce } from '@wordpress/compose';
import { __, _x } from '@wordpress/i18n';
import { search, closeSmall } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import TabPanelLayout from './tab-panel-layout';
import { FontLibraryContext } from './context';
import FontsGrid from './fonts-grid';
import FontCard from './font-card';
import filterFonts from './utils/filter-fonts';
import CollectionFontDetails from './collection-font-details';
import { toggleFont } from './utils/toggleFont';
import { getFontsOutline } from './utils/fonts-outline';
import GoogleFontsConfirmDialog from './google-fonts-confirm-dialog';
import { downloadFontFaceAssets } from './utils';

const DEFAULT_CATEGORY = {
	slug: 'all',
	name: _x( 'All', 'font categories' ),
};
function FontCollection( { slug } ) {
	const requiresPermission = slug === 'google-fonts';

	const getGoogleFontsPermissionFromStorage = () => {
		return (
			window.localStorage.getItem(
				'wp-font-library-google-fonts-permission'
			) === 'true'
		);
	};

	const [ selectedFont, setSelectedFont ] = useState( null );
	const [ fontsToInstall, setFontsToInstall ] = useState( [] );
	const [ filters, setFilters ] = useState( {} );
	const [ renderConfirmDialog, setRenderConfirmDialog ] = useState(
		requiresPermission && ! getGoogleFontsPermissionFromStorage()
	);
	const { collections, getFontCollection, installFont, notice, setNotice } =
		useContext( FontLibraryContext );
	const selectedCollection = collections.find(
		( collection ) => collection.slug === slug
	);

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

	useEffect( () => {
		const fetchFontCollection = async () => {
			try {
				await getFontCollection( slug );
				resetFilters();
			} catch ( e ) {
				if ( ! notice ) {
					setNotice( {
						type: 'error',
						message: e?.message,
					} );
				}
			}
		};
		fetchFontCollection();
	}, [ slug, getFontCollection, setNotice, notice ] );

	useEffect( () => {
		setSelectedFont( null );
		setNotice( null );
	}, [ slug, setNotice ] );

	useEffect( () => {
		// If the selected fonts change, reset the selected fonts to install
		setFontsToInstall( [] );
	}, [ selectedFont ] );

	const collectionFonts = useMemo(
		() => selectedCollection?.font_families ?? [],
		[ selectedCollection ]
	);
	const collectionCategories = selectedCollection?.categories ?? [];

	const categories = [ DEFAULT_CATEGORY, ...collectionCategories ];

	const fonts = useMemo(
		() => filterFonts( collectionFonts, filters ),
		[ collectionFonts, filters ]
	);

	const handleCategoryFilter = ( category ) => {
		setFilters( { ...filters, category } );
	};

	const handleUpdateSearchInput = ( value ) => {
		setFilters( { ...filters, search: value } );
	};

	const debouncedUpdateSearchInput = debounce( handleUpdateSearchInput, 300 );

	const resetFilters = () => {
		setFilters( {} );
	};

	const resetSearch = () => {
		setFilters( { ...filters, search: '' } );
	};

	const handleUnselectFont = () => {
		setSelectedFont( null );
	};

	const handleToggleVariant = ( font, face ) => {
		const newFontsToInstall = toggleFont( font, face, fontsToInstall );
		setFontsToInstall( newFontsToInstall );
	};

	const fontToInstallOutline = getFontsOutline( fontsToInstall );

	const resetFontsToInstall = () => {
		setFontsToInstall( [] );
	};

	const handleInstall = async () => {
		setNotice( null );

		const fontFamily = fontsToInstall[ 0 ];

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
			await installFont( fontFamily );
			setNotice( {
				type: 'success',
				message: __( 'Fonts were installed successfully.' ),
			} );
		} catch ( error ) {
			setNotice( {
				type: 'error',
				message: error.message,
			} );
		}
		resetFontsToInstall();
	};

	return (
		<TabPanelLayout
			title={
				! selectedFont ? selectedCollection.name : selectedFont.name
			}
			description={
				! selectedFont
					? selectedCollection.description
					: __( 'Select font variants to install.' )
			}
			notice={ notice }
			handleBack={ !! selectedFont && handleUnselectFont }
			footer={
				<Footer
					handleInstall={ handleInstall }
					isDisabled={ fontsToInstall.length === 0 }
				/>
			}
		>
			{ renderConfirmDialog && (
				<>
					<Spacer margin={ 8 } />
					<GoogleFontsConfirmDialog />
				</>
			) }

			{ ! renderConfirmDialog && ! selectedFont && (
				<Flex>
					<FlexItem>
						<InputControl
							value={ filters.search }
							placeholder={ __( 'Font name…' ) }
							label={ __( 'Search' ) }
							onChange={ debouncedUpdateSearchInput }
							prefix={ <Icon icon={ search } /> }
							suffix={
								filters?.search ? (
									<Icon
										icon={ closeSmall }
										onClick={ resetSearch }
									/>
								) : null
							}
						/>
					</FlexItem>
					<FlexItem>
						<SelectControl
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
					</FlexItem>
				</Flex>
			) }

			<Spacer margin={ 4 } />
			{ ! renderConfirmDialog &&
				! selectedCollection?.font_families &&
				! notice && <Spinner /> }

			{ ! renderConfirmDialog &&
				!! selectedCollection?.font_families?.length &&
				! fonts.length && (
					<Text>
						{ __(
							'No fonts found. Try with a different search term'
						) }
					</Text>
				) }

			{ ! renderConfirmDialog && selectedFont && (
				<CollectionFontDetails
					font={ selectedFont }
					handleToggleVariant={ handleToggleVariant }
					fontToInstallOutline={ fontToInstallOutline }
				/>
			) }

			{ ! renderConfirmDialog && ! selectedFont && (
				<FontsGrid>
					{ fonts.map( ( font ) => (
						<FontCard
							key={ font.font_family_settings.slug }
							font={ font.font_family_settings }
							onClick={ () => {
								setSelectedFont( font.font_family_settings );
							} }
						/>
					) ) }
				</FontsGrid>
			) }
		</TabPanelLayout>
	);
}

function Footer( { handleInstall, isDisabled } ) {
	const { isInstalling } = useContext( FontLibraryContext );

	return (
		<Flex justify="flex-end">
			<Button
				variant="primary"
				onClick={ handleInstall }
				isBusy={ isInstalling }
				disabled={ isDisabled || isInstalling }
				__experimentalIsFocusable
			>
				{ __( 'Install' ) }
			</Button>
		</Flex>
	);
}

export default FontCollection;

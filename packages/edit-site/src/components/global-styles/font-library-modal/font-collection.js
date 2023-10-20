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
	Notice,
} from '@wordpress/components';
import { debounce } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import { search, closeSmall } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import TabLayout from './tab-layout';
import { FontLibraryContext } from './context';
import FontsGrid from './fonts-grid';
import FontCard from './font-card';
import filterFonts from './utils/filter-fonts';
import CollectionFontDetails from './collection-font-details';
import { toggleFont } from './utils/toggleFont';
import { getFontsOutline } from './utils/fonts-outline';
import GoogleFontsConfirmDialog from './google-fonts-confirm-dialog';
import { getNoticeFromInstallResponse } from './utils/get-notice-from-response';

const DEFAULT_CATEGORY = {
	id: 'all',
	name: __( 'All' ),
};
function FontCollection( { id } ) {
	const requiresPermission = id === 'default-font-collection';

	const getGoogleFontsPermissionFromStorage = () => {
		return (
			window.localStorage.getItem(
				'wp-font-library-default-font-collection-permission'
			) === 'true'
		);
	};

	const [ notice, setNotice ] = useState( null );
	const [ selectedFont, setSelectedFont ] = useState( null );
	const [ fontsToInstall, setFontsToInstall ] = useState( [] );
	const [ filters, setFilters ] = useState( {} );
	const [ renderConfirmDialog, setRenderConfirmDialog ] = useState(
		requiresPermission && ! getGoogleFontsPermissionFromStorage()
	);
	const { collections, getFontCollection, installFonts } =
		useContext( FontLibraryContext );
	const selectedCollection = collections.find(
		( collection ) => collection.id === id
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
	}, [ id, requiresPermission ] );

	useEffect( () => {
		const fetchFontCollection = async () => {
			try {
				await getFontCollection( id );
				resetFilters();
			} catch ( e ) {
				setNotice( {
					type: 'error',
					message: e?.message,
					duration: 0, // Don't auto-hide.
				} );
			}
		};
		fetchFontCollection();
	}, [ id, getFontCollection ] );

	useEffect( () => {
		setSelectedFont( null );
		setNotice( null );
	}, [ id ] );

	// Reset notice after 5 seconds
	useEffect( () => {
		if ( notice && notice?.duration !== 0 ) {
			const timeout = setTimeout( () => {
				setNotice( null );
			}, notice.duration ?? 5000 );
			return () => clearTimeout( timeout );
		}
	}, [ notice ] );

	const collectionFonts = useMemo(
		() => selectedCollection?.data?.fontFamilies ?? [],
		[ selectedCollection ]
	);
	const collectionCategories = selectedCollection?.data?.categories ?? [];

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
		const response = await installFonts( fontsToInstall );
		const installNotice = getNoticeFromInstallResponse( response );
		setNotice( installNotice );
		resetFontsToInstall();
	};

	return (
		<TabLayout
			title={
				! selectedFont ? selectedCollection.name : selectedFont.name
			}
			description={
				! selectedFont
					? selectedCollection.description
					: __( 'Select font variants to install.' )
			}
			handleBack={ !! selectedFont && handleUnselectFont }
			footer={
				fontsToInstall.length > 0 && (
					<Footer handleInstall={ handleInstall } />
				)
			}
		>
			{ renderConfirmDialog && (
				<>
					<Spacer margin={ 8 } />
					<GoogleFontsConfirmDialog />
				</>
			) }

			{ notice && (
				<>
					<FlexItem>
						<Spacer margin={ 2 } />
						<Notice
							isDismissible={ false }
							status={ notice.type }
							className="font-library-modal__font-collection__notice"
						>
							{ notice.message }
						</Notice>
					</FlexItem>
					<Spacer margin={ 2 } />
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
										value={ category.id }
										key={ category.id }
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
				! selectedCollection?.data?.fontFamilies &&
				! notice && <Spinner /> }

			{ ! renderConfirmDialog &&
				!! selectedCollection?.data?.fontFamilies?.length &&
				! fonts.length && (
					<Text>
						{ __(
							'No fonts found. Try with a different seach term'
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
							key={ font.slug }
							font={ font }
							onClick={ () => {
								setSelectedFont( font );
							} }
						/>
					) ) }
				</FontsGrid>
			) }
		</TabLayout>
	);
}

function Footer( { handleInstall } ) {
	const { isInstalling } = useContext( FontLibraryContext );

	return (
		<Flex justify="flex-end">
			<Button
				variant="primary"
				onClick={ handleInstall }
				isBusy={ isInstalling }
				disabled={ isInstalling }
			>
				{ __( 'Install' ) }
			</Button>
		</Flex>
	);
}

export default FontCollection;

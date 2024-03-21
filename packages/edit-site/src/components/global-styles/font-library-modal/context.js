/**
 * WordPress dependencies
 */
import { createContext, useState, useEffect } from '@wordpress/element';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { useSelect, useDispatch } from '@wordpress/data';
import {
	useEntityRecord,
	useEntityRecords,
	store as coreStore,
} from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	fetchGetFontFamilyBySlug,
	fetchInstallFontFamily,
	fetchUninstallFontFamily,
	fetchFontCollections,
	fetchFontCollection,
} from './resolvers';
import { unlock } from '../../../lock-unlock';
const { useGlobalSetting } = unlock( blockEditorPrivateApis );
import {
	setUIValuesNeeded,
	mergeFontFamilies,
	loadFontFaceInBrowser,
	unloadFontFaceInBrowser,
	getDisplaySrcFromFontFace,
	makeFontFacesFormData,
	makeFontFamilyFormData,
	batchInstallFontFaces,
	checkFontFaceInstalled,
} from './utils';
import { toggleFont } from './utils/toggleFont';

export const FontLibraryContext = createContext( {} );

function FontLibraryProvider( { children } ) {
	const { __experimentalSaveSpecifiedEntityEdits: saveSpecifiedEntityEdits } =
		useDispatch( coreStore );
	const { globalStylesId } = useSelect( ( select ) => {
		const { __experimentalGetCurrentGlobalStylesId } = select( coreStore );
		return { globalStylesId: __experimentalGetCurrentGlobalStylesId() };
	} );

	const globalStyles = useEntityRecord(
		'root',
		'globalStyles',
		globalStylesId
	);
	const fontFamiliesHasChanges =
		!! globalStyles?.edits?.settings?.typography?.fontFamilies;

	const [ isInstalling, setIsInstalling ] = useState( false );
	const [ refreshKey, setRefreshKey ] = useState( 0 );
	const [ notice, setNotice ] = useState( null );

	const refreshLibrary = () => {
		setRefreshKey( Date.now() );
	};

	const {
		records: libraryPosts = [],
		isResolving: isResolvingLibrary,
		hasResolved: hasResolvedLibrary,
	} = useEntityRecords( 'postType', 'wp_font_family', {
		refreshKey,
		_embed: true,
	} );

	const libraryFonts =
		( libraryPosts || [] ).map( ( fontFamilyPost ) => {
			return {
				id: fontFamilyPost.id,
				...fontFamilyPost.font_family_settings,
				fontFace:
					fontFamilyPost?._embedded?.font_faces.map(
						( face ) => face.font_face_settings
					) || [],
			};
		} ) || [];

	// Global Styles (settings) font families
	const [ fontFamilies, setFontFamilies ] = useGlobalSetting(
		'typography.fontFamilies'
	);
	// theme.json file font families
	const [ baseFontFamilies ] = useGlobalSetting(
		'typography.fontFamilies',
		undefined,
		'base'
	);

	// Save font families to the global styles post in the database.
	const saveFontFamilies = () => {
		saveSpecifiedEntityEdits( 'root', 'globalStyles', globalStylesId, [
			'settings.typography.fontFamilies',
		] );
	};

	// Library Fonts
	const [ modalTabOpen, setModalTabOpen ] = useState( false );
	const [ libraryFontSelected, setLibraryFontSelected ] = useState( null );

	// Themes Fonts are the fonts defined in the global styles (database persisted theme.json data).
	const themeFonts = fontFamilies?.theme
		? fontFamilies.theme
				.map( ( f ) => setUIValuesNeeded( f, { source: 'theme' } ) )
				.sort( ( a, b ) => a.name.localeCompare( b.name ) )
		: [];

	const themeFontsSlugs = new Set( themeFonts.map( ( f ) => f.slug ) );

	/*
	 * Base Theme Fonts are the fonts defined in the theme.json *file*.
	 *
	 * Uses the fonts from global styles + the ones from the theme.json file that hasn't repeated slugs.
	 * Avoids incosistencies with the fonts listed in the font library modal as base (unactivated).
	 * These inconsistencies can happen when the active theme fonts in global styles aren't defined in theme.json file as when a theme style variation is applied.
	 */
	const baseThemeFonts = baseFontFamilies?.theme
		? themeFonts.concat(
				baseFontFamilies.theme
					.filter( ( f ) => ! themeFontsSlugs.has( f.slug ) )
					.map( ( f ) => setUIValuesNeeded( f, { source: 'theme' } ) )
					.sort( ( a, b ) => a.name.localeCompare( b.name ) )
		  )
		: [];

	const customFonts = fontFamilies?.custom
		? fontFamilies.custom
				.map( ( f ) => setUIValuesNeeded( f, { source: 'custom' } ) )
				.sort( ( a, b ) => a.name.localeCompare( b.name ) )
		: [];

	const baseCustomFonts = libraryFonts
		? libraryFonts
				.map( ( f ) => setUIValuesNeeded( f, { source: 'custom' } ) )
				.sort( ( a, b ) => a.name.localeCompare( b.name ) )
		: [];

	useEffect( () => {
		if ( ! modalTabOpen ) {
			setLibraryFontSelected( null );
		}
	}, [ modalTabOpen ] );

	const handleSetLibraryFontSelected = ( font ) => {
		setNotice( null );

		// If font is null, reset the selected font
		if ( ! font ) {
			setLibraryFontSelected( null );
			return;
		}

		const fonts = font.source === 'theme' ? themeFonts : baseCustomFonts;

		// Tries to find the font in the installed fonts
		const fontSelected = fonts.find( ( f ) => f.slug === font.slug );
		// If the font is not found (it is only defined in custom styles), use the font from custom styles
		setLibraryFontSelected( {
			...( fontSelected || font ),
			source: font.source,
		} );
	};

	const toggleModal = ( tabName ) => {
		setModalTabOpen( tabName || null );
	};

	// Demo
	const [ loadedFontUrls ] = useState( new Set() );

	const getAvailableFontsOutline = ( availableFontFamilies ) => {
		const outline = availableFontFamilies.reduce( ( acc, font ) => {
			const availableFontFaces =
				font?.fontFace && font.fontFace?.length > 0
					? font?.fontFace.map(
							( face ) => `${ face.fontStyle + face.fontWeight }`
					  )
					: [ 'normal400' ]; // If the font doesn't have fontFace, we assume it is a system font and we add the defaults: normal 400

			acc[ font.slug ] = availableFontFaces;
			return acc;
		}, {} );
		return outline;
	};

	const getActivatedFontsOutline = ( source ) => {
		switch ( source ) {
			case 'theme':
				return getAvailableFontsOutline( themeFonts );
			case 'custom':
			default:
				return getAvailableFontsOutline( customFonts );
		}
	};

	const isFontActivated = ( slug, style, weight, source ) => {
		if ( ! style && ! weight ) {
			return !! getActivatedFontsOutline( source )[ slug ];
		}
		return !! getActivatedFontsOutline( source )[ slug ]?.includes(
			style + weight
		);
	};

	const getFontFacesActivated = ( slug, source ) => {
		return getActivatedFontsOutline( source )[ slug ] || [];
	};

	async function installFonts( fontFamiliesToInstall ) {
		setIsInstalling( true );
		try {
			const fontFamiliesToActivate = [];
			let installationErrors = [];

			for ( const fontFamilyToInstall of fontFamiliesToInstall ) {
				let isANewFontFamily = false;

				// Get the font family if it already exists.
				let installedFontFamily = await fetchGetFontFamilyBySlug(
					fontFamilyToInstall.slug
				);

				// Otherwise create it.
				if ( ! installedFontFamily ) {
					isANewFontFamily = true;
					// Prepare font family form data to install.
					installedFontFamily = await fetchInstallFontFamily(
						makeFontFamilyFormData( fontFamilyToInstall )
					);
				}

				// Collect font faces that have already been installed (to be activated later)
				const alreadyInstalledFontFaces =
					installedFontFamily.fontFace && fontFamilyToInstall.fontFace
						? installedFontFamily.fontFace.filter(
								( fontFaceToInstall ) =>
									checkFontFaceInstalled(
										fontFaceToInstall,
										fontFamilyToInstall.fontFace
									)
						  )
						: [];

				// Filter out Font Faces that have already been installed (so that they are not re-installed)
				if (
					installedFontFamily.fontFace &&
					fontFamilyToInstall.fontFace
				) {
					fontFamilyToInstall.fontFace =
						fontFamilyToInstall.fontFace.filter(
							( fontFaceToInstall ) =>
								! checkFontFaceInstalled(
									fontFaceToInstall,
									installedFontFamily.fontFace
								)
						);
				}

				// Install the fonts (upload the font files to the server and create the post in the database).
				let sucessfullyInstalledFontFaces = [];
				let unsucessfullyInstalledFontFaces = [];
				if ( fontFamilyToInstall?.fontFace?.length > 0 ) {
					const response = await batchInstallFontFaces(
						installedFontFamily.id,
						makeFontFacesFormData( fontFamilyToInstall )
					);
					sucessfullyInstalledFontFaces = response?.successes;
					unsucessfullyInstalledFontFaces = response?.errors;
				}

				// Use the sucessfully installed font faces
				// As well as any font faces that were already installed (those will be activated)
				if (
					sucessfullyInstalledFontFaces?.length > 0 ||
					alreadyInstalledFontFaces?.length > 0
				) {
					fontFamilyToInstall.fontFace = [
						...sucessfullyInstalledFontFaces,
						...alreadyInstalledFontFaces,
					];
					fontFamiliesToActivate.push( fontFamilyToInstall );
				}

				// If it's a system font but was installed successfully, activate it.
				if (
					installedFontFamily &&
					! fontFamilyToInstall?.fontFace?.length
				) {
					fontFamiliesToActivate.push( installedFontFamily );
				}

				// If the font family is new and is not a system font, delete it to avoid having font families without font faces.
				if (
					isANewFontFamily &&
					fontFamilyToInstall?.fontFace?.length > 0 &&
					sucessfullyInstalledFontFaces?.length === 0
				) {
					await fetchUninstallFontFamily( installedFontFamily.id );
				}

				installationErrors = installationErrors.concat(
					unsucessfullyInstalledFontFaces
				);
			}

			installationErrors = installationErrors.reduce(
				( unique, item ) =>
					unique.includes( item.message )
						? unique
						: [ ...unique, item.message ],
				[]
			);

			if ( fontFamiliesToActivate.length > 0 ) {
				// Activate the font family (add the font family to the global styles).
				activateCustomFontFamilies( fontFamiliesToActivate );

				// Save the global styles to the database.
				await saveSpecifiedEntityEdits(
					'root',
					'globalStyles',
					globalStylesId,
					[ 'settings.typography.fontFamilies' ]
				);

				refreshLibrary();
			}

			if ( installationErrors.length > 0 ) {
				const installError = new Error(
					__( 'There was an error installing fonts.' )
				);

				installError.installationErrors = installationErrors;

				throw installError;
			}
		} finally {
			setIsInstalling( false );
		}
	}

	async function uninstallFontFamily( fontFamilyToUninstall ) {
		try {
			// Uninstall the font family.
			// (Removes the font files from the server and the posts from the database).
			const uninstalledFontFamily = await fetchUninstallFontFamily(
				fontFamilyToUninstall.id
			);

			// Deactivate the font family if delete request is successful
			// (Removes the font family from the global styles).
			if ( uninstalledFontFamily.deleted ) {
				deactivateFontFamily( fontFamilyToUninstall );
				// Save the global styles to the database.
				await saveSpecifiedEntityEdits(
					'root',
					'globalStyles',
					globalStylesId,
					[ 'settings.typography.fontFamilies' ]
				);
			}

			// Refresh the library (the library font families from database).
			refreshLibrary();

			return uninstalledFontFamily;
		} catch ( error ) {
			// eslint-disable-next-line no-console
			console.error(
				`There was an error uninstalling the font family:`,
				error
			);
			throw error;
		}
	}

	const deactivateFontFamily = ( font ) => {
		// If the user doesn't have custom fonts defined, include as custom fonts all the theme fonts
		// We want to save as active all the theme fonts at the beginning
		const initialCustomFonts = fontFamilies?.[ font.source ] ?? [];
		const newCustomFonts = initialCustomFonts.filter(
			( f ) => f.slug !== font.slug
		);
		setFontFamilies( {
			...fontFamilies,
			[ font.source ]: newCustomFonts,
		} );

		if ( font.fontFace ) {
			font.fontFace.forEach( ( face ) => {
				unloadFontFaceInBrowser( face, 'all' );
			} );
		}
	};

	const activateCustomFontFamilies = ( fontsToAdd ) => {
		// Merge the existing custom fonts with the new fonts.
		// Activate the fonts by set the new custom fonts array.
		setFontFamilies( {
			...fontFamilies,
			custom: mergeFontFamilies( fontFamilies?.custom, fontsToAdd ),
		} );
		// Add custom fonts to the browser.
		fontsToAdd.forEach( ( font ) => {
			if ( font.fontFace ) {
				font.fontFace.forEach( ( face ) => {
					// Load font faces just in the iframe because they already are in the document.
					loadFontFaceInBrowser(
						face,
						getDisplaySrcFromFontFace( face.src ),
						'all'
					);
				} );
			}
		} );
	};

	const toggleActivateFont = ( font, face ) => {
		// If the user doesn't have custom fonts defined, include as custom fonts all the theme fonts
		// We want to save as active all the theme fonts at the beginning
		const initialFonts = fontFamilies?.[ font.source ] ?? [];
		// Toggles the received font family or font face
		const newFonts = toggleFont( font, face, initialFonts );
		// Updates the font families activated in global settings:
		setFontFamilies( {
			...fontFamilies,
			[ font.source ]: newFonts,
		} );

		const isFaceActivated = isFontActivated(
			font.slug,
			face?.fontStyle,
			face?.fontWeight,
			font.source
		);

		if ( isFaceActivated ) {
			loadFontFaceInBrowser(
				face,
				getDisplaySrcFromFontFace( face?.src ),
				'all'
			);
		} else {
			unloadFontFaceInBrowser( face, 'all' );
		}
	};

	const loadFontFaceAsset = async ( fontFace ) => {
		// If the font doesn't have a src, don't load it.
		if ( ! fontFace.src ) return;
		// Get the src of the font.
		const src = getDisplaySrcFromFontFace( fontFace.src );
		// If the font is already loaded, don't load it again.
		if ( ! src || loadedFontUrls.has( src ) ) return;
		// Load the font in the browser.
		loadFontFaceInBrowser( fontFace, src, 'document' );
		// Add the font to the loaded fonts list.
		loadedFontUrls.add( src );
	};

	// Font Collections
	const [ collections, setFontCollections ] = useState( [] );
	const getFontCollections = async () => {
		const response = await fetchFontCollections();
		setFontCollections( response );
	};
	const getFontCollection = async ( slug ) => {
		try {
			const hasData = !! collections.find(
				( collection ) => collection.slug === slug
			)?.font_families;
			if ( hasData ) return;
			const response = await fetchFontCollection( slug );
			const updatedCollections = collections.map( ( collection ) =>
				collection.slug === slug
					? { ...collection, ...response }
					: collection
			);
			setFontCollections( updatedCollections );
		} catch ( e ) {
			// eslint-disable-next-line no-console
			console.error( e );
			throw e;
		}
	};

	useEffect( () => {
		getFontCollections();
	}, [] );

	return (
		<FontLibraryContext.Provider
			value={ {
				libraryFontSelected,
				handleSetLibraryFontSelected,
				themeFonts,
				baseThemeFonts,
				customFonts,
				baseCustomFonts,
				isFontActivated,
				getFontFacesActivated,
				loadFontFaceAsset,
				installFonts,
				uninstallFontFamily,
				toggleActivateFont,
				getAvailableFontsOutline,
				modalTabOpen,
				toggleModal,
				refreshLibrary,
				notice,
				setNotice,
				saveFontFamilies,
				fontFamiliesHasChanges,
				isResolvingLibrary,
				hasResolvedLibrary,
				isInstalling,
				collections,
				getFontCollection,
			} }
		>
			{ children }
		</FontLibraryContext.Provider>
	);
}

export default FontLibraryProvider;

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
import setNestedValue from '../../../utils/set-nested-value';

export const FontLibraryContext = createContext( {} );

function FontLibraryProvider( { children } ) {
	const { saveEntityRecord } = useDispatch( coreStore );
	const { globalStylesId } = useSelect( ( select ) => {
		const { __experimentalGetCurrentGlobalStylesId } = select( coreStore );
		return { globalStylesId: __experimentalGetCurrentGlobalStylesId() };
	} );

	const globalStyles = useEntityRecord(
		'root',
		'globalStyles',
		globalStylesId
	);

	const [ isInstalling, setIsInstalling ] = useState( false );
	const [ refreshKey, setRefreshKey ] = useState( 0 );

	const refreshLibrary = () => {
		setRefreshKey( Date.now() );
	};

	const { records: libraryPosts = [], isResolving: isResolvingLibrary } =
		useEntityRecords( 'postType', 'wp_font_family', {
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

	/*
	 * Save the font families to the database.

	 * This function is called when the user activates or deactivates a font family.
	 * It only updates the global styles post content in the database for new font families.
	 * This avoids saving other styles/settings changed by the user using other parts of the editor.
	 *
	 * It uses the font families from the param to avoid using the font families from an outdated state.
	 *
	 * @param {Array} fonts - The font families that will be saved to the database.
	 */
	const saveFontFamilies = async ( fonts ) => {
		// Gets the global styles database post content.
		const updatedGlobalStyles = globalStyles.record;

		// Updates the database version of global styles with the edited font families in the client.
		setNestedValue(
			updatedGlobalStyles,
			[ 'settings', 'typography', 'fontFamilies' ],
			fonts
		);

		// Saves a new version of the global styles in the database.
		await saveEntityRecord( 'root', 'globalStyles', updatedGlobalStyles );
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
				let successfullyInstalledFontFaces = [];
				let unsuccessfullyInstalledFontFaces = [];
				if ( fontFamilyToInstall?.fontFace?.length > 0 ) {
					const response = await batchInstallFontFaces(
						installedFontFamily.id,
						makeFontFacesFormData( fontFamilyToInstall )
					);
					successfullyInstalledFontFaces = response?.successes;
					unsuccessfullyInstalledFontFaces = response?.errors;
				}

				// Use the successfully installed font faces
				// As well as any font faces that were already installed (those will be activated)
				if (
					successfullyInstalledFontFaces?.length > 0 ||
					alreadyInstalledFontFaces?.length > 0
				) {
					// Use font data from REST API not from client to ensure
					// correct font information is used.
					installedFontFamily.fontFace = [
						...successfullyInstalledFontFaces,
					];

					fontFamiliesToActivate.push( installedFontFamily );
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
					successfullyInstalledFontFaces?.length === 0
				) {
					await fetchUninstallFontFamily( installedFontFamily.id );
				}

				installationErrors = installationErrors.concat(
					unsuccessfullyInstalledFontFaces
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
				const activeFonts = activateCustomFontFamilies(
					fontFamiliesToActivate
				);
				// Save the global styles to the database.
				await saveFontFamilies( activeFonts );

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
				const activeFonts = deactivateFontFamily(
					fontFamilyToUninstall
				);
				// Save the global styles to the database.
				await saveFontFamilies( activeFonts );
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
		const activeFonts = {
			...fontFamilies,
			[ font.source ]: newCustomFonts,
		};
		setFontFamilies( activeFonts );

		if ( font.fontFace ) {
			font.fontFace.forEach( ( face ) => {
				unloadFontFaceInBrowser( face, 'all' );
			} );
		}
		return activeFonts;
	};

	const activateCustomFontFamilies = ( fontsToAdd ) => {
		const fontsToActivate = cleanFontsForSave( fontsToAdd );

		const activeFonts = {
			...fontFamilies,
			// Merge the existing custom fonts with the new fonts.
			custom: mergeFontFamilies( fontFamilies?.custom, fontsToActivate ),
		};

		// Activate the fonts by set the new custom fonts array.
		setFontFamilies( activeFonts );

		loadFontsInBrowser( fontsToActivate );

		return activeFonts;
	};

	// Removes the id from the families and faces to avoid saving that to global styles post content.
	const cleanFontsForSave = ( fonts ) => {
		return fonts.map( ( { id: _familyDbId, fontFace, ...font } ) => ( {
			...font,
			...( fontFace && fontFace.length > 0
				? {
						fontFace: fontFace.map(
							( { id: _faceDbId, ...face } ) => face
						),
				  }
				: {} ),
		} ) );
	};

	const loadFontsInBrowser = ( fonts ) => {
		// Add custom fonts to the browser.
		fonts.forEach( ( font ) => {
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
			unloadFontFaceInBrowser( face, 'all' );
		} else {
			loadFontFaceInBrowser(
				face,
				getDisplaySrcFromFontFace( face?.src ),
				'all'
			);
		}
	};

	const loadFontFaceAsset = async ( fontFace ) => {
		// If the font doesn't have a src, don't load it.
		if ( ! fontFace.src ) {
			return;
		}
		// Get the src of the font.
		const src = getDisplaySrcFromFontFace( fontFace.src );
		// If the font is already loaded, don't load it again.
		if ( ! src || loadedFontUrls.has( src ) ) {
			return;
		}
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
			if ( hasData ) {
				return;
			}
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
				fontFamilies,
				baseCustomFonts,
				isFontActivated,
				getFontFacesActivated,
				loadFontFaceAsset,
				installFonts,
				uninstallFontFamily,
				toggleActivateFont,
				getAvailableFontsOutline,
				modalTabOpen,
				setModalTabOpen,
				refreshLibrary,
				saveFontFamilies,
				isResolvingLibrary,
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

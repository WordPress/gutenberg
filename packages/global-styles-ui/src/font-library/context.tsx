/**
 * WordPress dependencies
 */
import { createContext, useState, useEffect } from '@wordpress/element';
import {
	useSelect,
	useDispatch,
	resolveSelect,
	useRegistry,
} from '@wordpress/data';
import {
	useEntityRecord,
	useEntityRecords,
	store as coreStore,
} from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';
import type {
	FontFamilyPreset,
	GlobalStylesConfig,
} from '@wordpress/global-styles-engine';
import type {
	CollectionFontFace,
	CollectionFontFamily,
	FontFace,
	FontFamily,
} from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { fetchInstallFontFamily } from './api';
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
import { setImmutably } from './utils/set-immutably';
import { toggleFont } from './utils/toggleFont';
import type { FontFamilyToUpload, FontLibraryState } from './types';
import { useSetting } from '../hooks';

export const FontLibraryContext = createContext< FontLibraryState >(
	{} as FontLibraryState
);
FontLibraryContext.displayName = 'FontLibraryContext';

function FontLibraryProvider( { children }: { children: React.ReactNode } ) {
	const registry = useRegistry();
	const { saveEntityRecord, deleteEntityRecord } = useDispatch( coreStore );
	const { globalStylesId } = useSelect( ( select ) => {
		const { __experimentalGetCurrentGlobalStylesId } = select( coreStore );
		return { globalStylesId: __experimentalGetCurrentGlobalStylesId() };
	}, [] );

	const globalStyles = useEntityRecord< GlobalStylesConfig >(
		'root',
		'globalStyles',
		globalStylesId
	);

	const [ isInstalling, setIsInstalling ] = useState( false );

	const { records: libraryPosts = [], isResolving: isResolvingLibrary } =
		useEntityRecords< CollectionFontFamily >(
			'postType',
			'wp_font_family',
			{
				_embed: true,
			}
		);

	const libraryFonts: FontFamilyPreset[] =
		( libraryPosts || [] ).map( ( fontFamilyPost ) => {
			return {
				id: fontFamilyPost.id,
				...( fontFamilyPost.font_family_settings || {} ),
				fontFace:
					fontFamilyPost?._embedded?.font_faces?.map(
						( face ) => face.font_face_settings
					) || [],
			};
		} ) || [];

	// Global Styles (settings) font families
	const [ fontFamilies, setFontFamilies ] = useSetting<
		Record< string, FontFamilyPreset[] > | undefined
	>( 'typography.fontFamilies' );

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
	const saveFontFamilies = async (
		fonts:
			| FontFamilyPreset[]
			| Record< string, FontFamilyPreset[] >
			| undefined
	) => {
		if ( ! globalStyles.record ) {
			return;
		}
		// Gets the global styles database post content.
		const updatedGlobalStyles = globalStyles.record;

		// Updates the database version of global styles with the edited font families in the client.
		const finalGlobalStyles = setImmutably(
			updatedGlobalStyles ?? {},
			[ 'settings', 'typography', 'fontFamilies' ],
			fonts
		);

		// Saves a new version of the global styles in the database.
		await saveEntityRecord( 'root', 'globalStyles', finalGlobalStyles );
	};

	// Library Fonts
	const [ modalTabOpen, setModalTabOpen ] = useState( '' );
	const [ libraryFontSelected, setLibraryFontSelected ] = useState<
		FontFamily | undefined
	>( undefined );

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
			setLibraryFontSelected( undefined );
		}
	}, [ modalTabOpen ] );

	const handleSetLibraryFontSelected = ( font?: FontFamily ) => {
		// If font is null, reset the selected font
		if ( ! font ) {
			setLibraryFontSelected( undefined );
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

	const getAvailableFontsOutline = (
		availableFontFamilies: FontFamily[]
	) => {
		const outline: Record< string, string[] > =
			availableFontFamilies.reduce(
				( acc: Record< string, string[] >, font ) => {
					const availableFontFaces =
						font?.fontFace && font.fontFace?.length > 0
							? font?.fontFace.map(
									( face ) =>
										`${ face.fontStyle ?? '' }${
											face.fontWeight ?? ''
										}`
							  )
							: [ 'normal400' ]; // If the font doesn't have fontFace, we assume it is a system font and we add the defaults: normal 400

					acc[ font.slug ] = availableFontFaces;
					return acc;
				},
				{}
			);
		return outline;
	};

	const getActivatedFontsOutline = ( source?: string ) => {
		switch ( source ) {
			case 'theme':
				return getAvailableFontsOutline( themeFonts );
			case 'custom':
			default:
				return getAvailableFontsOutline( customFonts );
		}
	};

	const isFontActivated = (
		slug: string,
		style?: string,
		weight?: string | number,
		source?: string
	) => {
		if ( ! style && ! weight ) {
			return !! getActivatedFontsOutline( source )[ slug ];
		}
		return !! getActivatedFontsOutline( source )[ slug ]?.includes(
			( style ?? '' ) + ( weight ?? '' )
		);
	};

	const getFontFacesActivated = ( slug: string, source?: string ) => {
		return getActivatedFontsOutline( source )[ slug ] || [];
	};

	async function installFonts( fontFamiliesToInstall: FontFamilyToUpload[] ) {
		setIsInstalling( true );
		try {
			const fontFamiliesToActivate = [];
			let installationErrors: Array< {
				message: string;
			} > = [];

			for ( const fontFamilyToInstall of fontFamiliesToInstall ) {
				let isANewFontFamily = false;

				// Get the font family if it already exists.
				const fontFamilyRecords = await resolveSelect(
					coreStore
				).getEntityRecords( 'postType', 'wp_font_family', {
					slug: fontFamilyToInstall.slug,
					per_page: 1,
					_embed: true,
				} );

				const fontFamilyPost =
					fontFamilyRecords && fontFamilyRecords.length > 0
						? fontFamilyRecords[ 0 ]
						: null;

				let installedFontFamily = fontFamilyPost
					? {
							id: fontFamilyPost.id,
							...fontFamilyPost.font_family_settings,
							fontFace:
								(
									fontFamilyPost?._embedded?.font_faces ?? []
								).map(
									( face: CollectionFontFace ) =>
										face.font_face_settings
								) || [],
					  }
					: null;

				// Otherwise create it.
				if ( ! installedFontFamily ) {
					isANewFontFamily = true;
					// Prepare font family form data to install.
					installedFontFamily = await fetchInstallFontFamily(
						makeFontFamilyFormData( fontFamilyToInstall ),
						registry
					);
				}

				// Collect font faces that have already been installed (to be activated later)
				const alreadyInstalledFontFaces =
					installedFontFamily.fontFace && fontFamilyToInstall.fontFace
						? installedFontFamily.fontFace.filter(
								( fontFaceToInstall: FontFace ) =>
									fontFaceToInstall &&
									fontFamilyToInstall.fontFace &&
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
				let successfullyInstalledFontFaces: FontFace[] = [];
				let unsuccessfullyInstalledFontFaces: {
					message: string;
				}[] = [];
				if ( fontFamilyToInstall?.fontFace?.length ?? 0 > 0 ) {
					const response = await batchInstallFontFaces(
						installedFontFamily.id,
						makeFontFacesFormData(
							fontFamilyToInstall as FontFamily
						),
						registry
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
					( fontFamilyToInstall?.fontFace?.length ?? 0 ) > 0 &&
					successfullyInstalledFontFaces?.length === 0
				) {
					await deleteEntityRecord(
						'postType',
						'wp_font_family',
						installedFontFamily.id,
						{ force: true }
					);
				}

				installationErrors = installationErrors.concat(
					unsuccessfullyInstalledFontFaces
				);
			}

			const installationErrorMessages: string[] =
				installationErrors.reduce(
					( unique: string[], item ) =>
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
			}

			if ( installationErrorMessages.length > 0 ) {
				const installError: Error & {
					installationErrors?: string[];
				} = new Error( __( 'There was an error installing fonts.' ) );

				installError.installationErrors = installationErrorMessages;

				throw installError;
			}
		} finally {
			setIsInstalling( false );
		}
	}

	async function uninstallFontFamily( fontFamilyToUninstall: FontFamily ) {
		if ( ! fontFamilyToUninstall?.id ) {
			throw new Error( __( 'Font family to uninstall is not defined.' ) );
		}
		try {
			// Uninstall the font family.
			// (Removes the font files from the server and the posts from the database).
			await deleteEntityRecord(
				'postType',
				'wp_font_family',
				fontFamilyToUninstall.id,
				{ force: true }
			);

			// Deactivate the font family (remove from global styles).
			const activeFonts = deactivateFontFamily( fontFamilyToUninstall );
			// Save the global styles to the database.
			await saveFontFamilies( activeFonts );
			return { deleted: true };
		} catch ( error ) {
			// eslint-disable-next-line no-console
			console.error(
				`There was an error uninstalling the font family:`,
				error
			);
			throw error;
		}
	}

	const deactivateFontFamily = ( font: FontFamily ) => {
		// If the user doesn't have custom fonts defined, include as custom fonts all the theme fonts
		// We want to save as active all the theme fonts at the beginning
		const initialCustomFonts = fontFamilies?.[ font.source ?? '' ] ?? [];
		const newCustomFonts = initialCustomFonts.filter(
			( f ) => f.slug !== font.slug
		);
		const activeFonts = {
			...fontFamilies,
			[ font.source ?? '' ]: newCustomFonts,
		};
		setFontFamilies( activeFonts );

		if ( font.fontFace ) {
			font.fontFace.forEach( ( face ) => {
				unloadFontFaceInBrowser( face, 'all' );
			} );
		}
		return activeFonts;
	};

	const activateCustomFontFamilies = ( fontsToAdd: FontFamily[] ) => {
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
	const cleanFontsForSave = ( fonts: FontFamily[] ) => {
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

	const loadFontsInBrowser = ( fonts: FontFamily[] ) => {
		// Add custom fonts to the browser.
		fonts.forEach( ( font ) => {
			if ( font.fontFace ) {
				font.fontFace.forEach( ( face ) => {
					const displaySrc = getDisplaySrcFromFontFace(
						face?.src ?? ''
					);
					if ( displaySrc ) {
						// Load font faces just in the iframe because they already are in the document.
						loadFontFaceInBrowser( face, displaySrc, 'all' );
					}
				} );
			}
		} );
	};

	const toggleActivateFont = ( font: FontFamily, face?: FontFace ) => {
		// If the user doesn't have custom fonts defined, include as custom fonts all the theme fonts
		// We want to save as active all the theme fonts at the beginning
		const initialFonts = fontFamilies?.[ font.source ?? '' ] ?? [];
		// Toggles the received font family or font face
		const newFonts = toggleFont( font, face, initialFonts );
		// Updates the font families activated in global settings:
		setFontFamilies( {
			...fontFamilies,
			[ font.source ?? '' ]: newFonts,
		} );

		const isFaceActivated = isFontActivated(
			font.slug,
			face?.fontStyle ?? '',
			face?.fontWeight ?? '',
			font.source ?? 'custom'
		);

		if ( face && isFaceActivated ) {
			unloadFontFaceInBrowser( face, 'all' );
		} else {
			const displaySrc = getDisplaySrcFromFontFace( face?.src ?? '' );
			// If the font doesn't have a src, don't load it.
			if ( face && displaySrc ) {
				loadFontFaceInBrowser( face, displaySrc, 'all' );
			}
		}
	};

	const loadFontFaceAsset = async ( fontFace: FontFace ) => {
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

	return (
		<FontLibraryContext.Provider
			value={ {
				libraryFontSelected,
				handleSetLibraryFontSelected,
				fontFamilies: fontFamilies ?? {},
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
				saveFontFamilies,
				isResolvingLibrary,
				isInstalling,
			} }
		>
			{ children }
		</FontLibraryContext.Provider>
	);
}

export default FontLibraryProvider;

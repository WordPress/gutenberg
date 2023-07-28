/**
 * WordPress dependencies
 */
import {
	createContext,
	useState,
	useEffect,
	useMemo,
} from '@wordpress/element';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { useEntityRecords } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import {
	fetchGoogleFonts,
	fetchInstallFonts,
	fetchUninstallFonts,
} from './resolvers';
import { DEFAULT_DEMO_CONFIG } from './constants';
import { unlock } from "../../../lock-unlock";
const { useGlobalSetting } = unlock( blockEditorPrivateApis );
import { setUIValuesNeeded, isUrlEncoded } from './utils';

export const FontLibraryContext = createContext( {} );

function FontLibraryProvider( { children } ) {

	const [refreshKey, setRefreshKey] = useState(0);

	const refreshLibrary = () => {
		setRefreshKey(prevKey => prevKey + 1);
	};

	const { records: posts = [] } = useEntityRecords(
		'postType',
		'wp_font_family',
		{ refreshKey }
	);

	const libraryFonts = ( posts || [] ).map( post => (
		JSON.parse( post.content.raw )
	)) || [];
	

	// Global Styles (settings) font families
	const [ fontFamilies, setFontFamilies ] = useGlobalSetting(
		'typography.fontFamilies'
	);
	// theme.json file font families
	const [ baseFontFamilies ] = useGlobalSetting(
		'typography.fontFamilies', undefined, 'base'
	);

	// Library Fonts
	const [ modalTabOepn, setModalTabOepn ] = useState( false );
	const [ libraryFontSelected, setLibraryFontSelected ] = useState( null );

	const baseThemeFonts = baseFontFamilies?.theme
	? baseFontFamilies.theme
		.map( f => setUIValuesNeeded(f, { source: 'theme' }) )
		.sort( ( a, b ) => ( a.name ).localeCompare( b.name ) )
	: [];

	const themeFonts = fontFamilies.theme
		? fontFamilies.theme
			.map( f => setUIValuesNeeded(f, { source: 'theme' }) )
			.sort( ( a, b ) => ( a.name ).localeCompare( b.name ) )
		: [];

	const customFonts = fontFamilies.custom
		? fontFamilies.custom
			.map( f => setUIValuesNeeded(f, { source: 'custom' }) )
			.sort( ( a, b ) => ( a.name ).localeCompare( b.name ) )
		: [];

	const baseCustomFonts = libraryFonts
		? libraryFonts
			.map( f => setUIValuesNeeded(f, { source: 'custom' }) )
			.sort( ( a, b ) => ( a.name ).localeCompare( b.name ) )
		: [];

	useEffect( () => {
		if ( ! modalTabOepn ) {
			setLibraryFontSelected( null );
		} 
	}, [ modalTabOepn ] );

	const handleSetLibraryFontSelected = ( font ) => {
		// If font is null, reset the selected font
		if ( ! font ){
			setLibraryFontSelected( null );
			return;
		}

		const fonts = font.source === 'theme' ? baseThemeFonts : baseCustomFonts;

		// Tries to find the font in the installed fonts 
		const fontSelected = fonts.find( ( f ) => f.slug === font.slug );
		// If the font is not found (it is only defined in custom styles), use the font from custom styles
		setLibraryFontSelected ({
			...( fontSelected || font ),
			source: font.source,
		});
	};

	const toggleModal = ( tabName ) => {
		setModalTabOepn( tabName || null );
	};

	// Google Fonts
	const [ googleFonts, setGoogleFonts ] = useState( null );
	const [ googleFontsCategories, setGoogleFontsCategories ] =
		useState( null );

	// Demo
	const loadedFontUrls = new Set();
	const [ demoConfig, setDemoConfig ] = useState( DEFAULT_DEMO_CONFIG );
	const updateDemoConfig = ( key, value ) => {
		setDemoConfig( {
			...demoConfig,
			[ key ]: value,
		} );
	};
	const setDefaultDemoConfig = ( key ) => {
		if ( key ) {
			setDemoConfig( {
				...demoConfig,
				[ key ]: DEFAULT_DEMO_CONFIG[ key ],
			} );
		} else {
			setDemoConfig( DEFAULT_DEMO_CONFIG );
		}
	};

	// Theme data
	const { site, currentTheme } = useSelect( ( select ) => {
		const site = select( 'core' ).getSite();
		const currentTheme = select( 'core' ).getCurrentTheme();
		return {
			site,
			currentTheme,
		};
	} );
	const themeUrl =
		site?.url + '/wp-content/themes/' + currentTheme?.stylesheet;

	useEffect( () => {
		fetchGoogleFonts().then( ( { fontFamilies, categories } ) => {
			setGoogleFonts( fontFamilies );
			setGoogleFontsCategories( [ 'all', ...categories ] );
		} );
	}, [] );

	const getAvailableFontsOutline = ( fontFamilies ) => {
		const outline = fontFamilies.reduce( ( acc, font ) => {
			
			const availableFontFaces = Array.isArray( font?.fontFace )
				? font?.fontFace.map(
					( face ) => `${ face.fontStyle + face.fontWeight }`	)
				: [ "normal400" ]; // If the font doesn't have fontFace, we assume it is a system font and we add the defaults: normal 400 

			acc[ font.slug ] = availableFontFaces;
			return acc;
		}, {} );
		return outline;
	};

	const activatedFontsOutline = useMemo( () => {
		return getAvailableFontsOutline(
			[].concat( themeFonts, customFonts )
		);
	}, [ customFonts ] );

	const isFontActivated = ( slug, style, weight ) => {
		if ( ! style && ! weight ) {
			return !! activatedFontsOutline[ slug ];
		}
		return !! activatedFontsOutline[ slug ]?.includes( style + weight );
	};

	const getFontFacesActivated = ( slug ) => {
		return activatedFontsOutline[ slug ] || [];
	};

	async function installFonts( libraryFonts ) {
		const newLibraryFonts = await fetchInstallFonts( libraryFonts );
	}

	async function uninstallFont( font ) {
		await fetchUninstallFonts( font );
		refreshLibrary();
	}

	const toggleActivateFont = ( font, face ) => {
		const source = font.source || 'custom';

		// If the user doesn't have custom fonts defined, include as custom fonts all the theme fonts
		// We want to save as active all the theme fonts at the beginning
		const initialCustomFonts = fontFamilies[ source ] || [];

		const activatedFont = initialCustomFonts.find(
			( f ) => f.slug === font.slug
		);
		let newCustomFonts;

		// Entire font family
		if ( ! face ) {
			if ( ! activatedFont ) {
				// If the font is not active, activate the entire font family
				newCustomFonts = [ ...initialCustomFonts, font ];
			} else {
				// If the font is already active, deactivate the entire font family
				newCustomFonts = initialCustomFonts.filter(
					( f ) => f.slug !== font.slug
				);
			}
		} else {
			//single font variant
			let newFontFaces;

			// If the font family is active
			if ( activatedFont ) {
				const activatedFontFace = ( activatedFont.fontFace || [] ).find(
					( f ) =>
						f.fontWeight === face.fontWeight &&
						f.fontStyle === face.fontStyle
				);
				// If the font variant is active
				if ( activatedFontFace ) {
					// Deactivate the font variant
					newFontFaces = activatedFont.fontFace.filter(
						( f ) =>
							! (
								f.fontWeight === face.fontWeight &&
								f.fontStyle === face.fontStyle
							)
					);
					// If there are no more font faces, deactivate the font family
					if ( newFontFaces?.length === 0 ) {
						newCustomFonts = initialCustomFonts.filter(
							( f ) => f.slug !== font.slug
						);
					} else {
						// set the newFontFaces in the newCustomFonts
						newCustomFonts = initialCustomFonts.map( ( f ) =>
							f.slug === font.slug
								? { ...f, fontFace: newFontFaces }
								: f
						);
					}
				} else {
					// Activate the font variant
					newFontFaces = [ ...activatedFont.fontFace, face ];
					// set the newFontFaces in the newCustomFonts
					newCustomFonts = initialCustomFonts.map( ( f ) =>
						f.slug === font.slug
							? { ...f, fontFace: newFontFaces }
							: f
					);
				}
			} else {
				// If the font family is not active, activate the font family with the font variant
				newFontFaces = [ face ];
				newCustomFonts = [
					...initialCustomFonts,
					{ ...font, fontFace: newFontFaces },
				];
			}
		}
		console.log('source', newCustomFonts);
		setFontFamilies( {
			...fontFamilies,
			[ source ]: newCustomFonts,
		} );
	};

	const loadFontFaceAsset = async ( fontFace ) => {
		if ( ! fontFace.src ) {
			return;
		}

		let src = fontFace.src;
		if ( Array.isArray( src ) ) {
			src = src[ 0 ];
		}

		// If it is a theme font, we need to make the url absolute
		if ( src.startsWith( 'file:.' ) ) {
			src = src.replace( 'file:.', themeUrl );
		}

		if ( loadedFontUrls.has( src ) ) {
			return;
		}
		
		if ( ! isUrlEncoded ) {
			src = encodeURI( src );
		}

		const newFont = new FontFace( fontFace.fontFamily, `url( ${ src } )`, {
			style: fontFace.fontStyle,
			weight: fontFace.fontWeight,
		} );

		try {
			const loadedFace = await newFont.load();
			document.fonts.add( loadedFace );
		} catch ( e ) { // If the url is not valid we mark the font as loaded
			console.error( e );
		}

		loadedFontUrls.add( src );
	};

	return (
		<FontLibraryContext.Provider
			value={ {
				demoConfig,
				updateDemoConfig,
				setDefaultDemoConfig,
				libraryFontSelected,
				handleSetLibraryFontSelected,
				themeFonts,
				baseThemeFonts,
				customFonts,
				baseCustomFonts,
				isFontActivated,
				getFontFacesActivated,
				googleFonts,
				googleFontsCategories,
				loadFontFaceAsset,
				installFonts,
				uninstallFont,
				toggleActivateFont,
				getAvailableFontsOutline,
				modalTabOepn,
				toggleModal,
				refreshLibrary
			} }
		>
			{ children }
		</FontLibraryContext.Provider>
	);
}

export default FontLibraryProvider;

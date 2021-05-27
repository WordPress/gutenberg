/**
 * External dependencies
 */
import { set, get, mergeWith } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
} from '@wordpress/element';
import {
	__EXPERIMENTAL_STYLE_PROPERTY as STYLE_PROPERTY,
	__EXPERIMENTAL_ELEMENTS as ELEMENTS,
	store as blocksStore,
} from '@wordpress/blocks';
import { useEntityProp } from '@wordpress/core-data';
import { useSelect, useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import {
	ROOT_BLOCK_NAME,
	ROOT_BLOCK_SELECTOR,
	ROOT_BLOCK_SUPPORTS,
	getValueFromVariable,
	getPresetVariable,
} from './utils';
import { toCustomProperties, toStyles } from './global-styles-renderer';
import { store as editSiteStore } from '../../store';

const EMPTY_CONTENT = { isGlobalStylesUserThemeJSON: true, version: 1 };
const EMPTY_CONTENT_STRING = JSON.stringify( EMPTY_CONTENT );

const GlobalStylesContext = createContext( {
	/* eslint-disable no-unused-vars */
	getSetting: ( context, path ) => {},
	setSetting: ( context, path, newValue ) => {},
	getStyle: ( context, propertyName, origin ) => {},
	setStyle: ( context, propertyName, newValue ) => {},
	contexts: {},
	/* eslint-enable no-unused-vars */
} );

const mergeTreesCustomizer = ( objValue, srcValue, key ) => {
	// Users can add their own colors.
	// We want to append them when they don't
	// have the same slug as an existing color,
	// otherwise we want to update the existing color instead.
	if ( 'palette' === key ) {
		const indexTable = {};
		const existingSlugs = [];
		const result = [ ...( objValue ?? [] ) ];
		result.forEach( ( { slug }, index ) => {
			indexTable[ slug ] = index;
			existingSlugs.push( slug );
		} );

		( srcValue ?? [] ).forEach( ( element ) => {
			if ( existingSlugs.includes( element?.slug ) ) {
				result[ indexTable[ element?.slug ] ] = element;
			} else {
				result.push( element );
			}
		} );

		return result;
	}

	// We only pass as arrays the presets,
	// in which case we want the new array of values
	// to override the old array (no merging).
	if ( Array.isArray( srcValue ) ) {
		return srcValue;
	}
};

export const useGlobalStylesContext = () => useContext( GlobalStylesContext );

const useGlobalStylesEntityContent = () => {
	return useEntityProp( 'postType', 'wp_global_styles', 'content' );
};

export const useGlobalStylesReset = () => {
	const [ content, setContent ] = useGlobalStylesEntityContent();
	const canRestart = !! content && content !== EMPTY_CONTENT_STRING;
	return [
		canRestart,
		useCallback( () => setContent( EMPTY_CONTENT_STRING ), [ setContent ] ),
	];
};

const extractSupportKeys = ( supports ) => {
	const supportKeys = [];
	Object.keys( STYLE_PROPERTY ).forEach( ( name ) => {
		if ( get( supports, STYLE_PROPERTY[ name ].support, false ) ) {
			supportKeys.push( name );
		}
	} );
	return supportKeys;
};

const getBlockMetadata = ( blockTypes ) => {
	const result = {};

	blockTypes.forEach( ( blockType ) => {
		const name = blockType.name;
		const supports = extractSupportKeys( blockType?.supports );

		const selector =
			blockType?.supports?.__experimentalSelector ??
			'.wp-block-' + name.replace( 'core/', '' ).replace( '/', '-' );
		const blockSelectors = selector.split( ',' );
		const elements = [];
		Object.keys( ELEMENTS ).forEach( ( key ) => {
			const elementSelector = [];
			blockSelectors.forEach( ( blockSelector ) => {
				elementSelector.push( blockSelector + ' ' + ELEMENTS[ key ] );
			} );
			elements[ key ] = elementSelector.join( ',' );
		} );
		result[ name ] = {
			name,
			selector,
			supports,
			elements,
		};
	} );

	return result;
};

export default function GlobalStylesProvider( { children, baseStyles } ) {
	const [ content, setContent ] = useGlobalStylesEntityContent();
	const { blockTypes, settings } = useSelect( ( select ) => {
		return {
			blockTypes: select( blocksStore ).getBlockTypes(),
			settings: select( editSiteStore ).getSettings(),
		};
	} );
	const { updateSettings } = useDispatch( editSiteStore );

	const blocks = useMemo( () => getBlockMetadata( blockTypes ), [
		blockTypes,
	] );

	const { __experimentalGlobalStylesBaseStyles: themeStyles } = settings;
	const { userStyles, mergedStyles } = useMemo( () => {
		let newUserStyles;
		try {
			newUserStyles = content ? JSON.parse( content ) : EMPTY_CONTENT;

			// At the moment, we ignore previous user config that
			// is in a different version than the theme config.
			if ( newUserStyles?.version !== baseStyles?.version ) {
				newUserStyles = EMPTY_CONTENT;
			}
		} catch ( e ) {
			/* eslint-disable no-console */
			console.error( 'User data is not JSON' );
			console.error( e );
			/* eslint-enable no-console */
			newUserStyles = EMPTY_CONTENT;
		}

		// It is very important to verify if the flag isGlobalStylesUserThemeJSON is true.
		// If it is not true the content was not escaped and is not safe.
		if ( ! newUserStyles.isGlobalStylesUserThemeJSON ) {
			newUserStyles = EMPTY_CONTENT;
		}

		// At this point, the version schema of the theme & user
		// is the same, so we can merge them.
		const newMergedStyles = mergeWith(
			{},
			baseStyles,
			newUserStyles,
			mergeTreesCustomizer
		);

		return {
			userStyles: newUserStyles,
			mergedStyles: newMergedStyles,
		};
	}, [ content ] );

	const nextValue = useMemo(
		() => ( {
			root: {
				name: ROOT_BLOCK_NAME,
				selector: ROOT_BLOCK_SELECTOR,
				supports: ROOT_BLOCK_SUPPORTS,
				elements: ELEMENTS,
			},
			blocks,
			getSetting: ( context, propertyPath ) => {
				const path =
					context === ROOT_BLOCK_NAME
						? propertyPath
						: [ 'blocks', context, ...propertyPath ];
				get( userStyles?.settings, path );
			},
			setSetting: ( context, propertyPath, newValue ) => {
				const newContent = { ...userStyles };
				const path =
					context === ROOT_BLOCK_NAME
						? [ 'settings' ]
						: [ 'settings', 'blocks', context ];

				let newSettings = get( newContent, path );
				if ( ! newSettings ) {
					newSettings = {};
					set( newContent, path, newSettings );
				}
				set( newSettings, propertyPath, newValue );

				setContent( JSON.stringify( newContent ) );
			},
			getStyle: ( context, propertyName, origin = 'merged' ) => {
				const propertyPath = STYLE_PROPERTY[ propertyName ].value;
				const path =
					context === ROOT_BLOCK_NAME
						? propertyPath
						: [ 'blocks', context, ...propertyPath ];

				if ( origin === 'theme' ) {
					const value = get( themeStyles?.styles, path );
					return getValueFromVariable( themeStyles, context, value );
				}

				if ( origin === 'user' ) {
					const value = get( userStyles?.styles, path );

					// We still need to use merged styles here because the
					// presets used to resolve user variable may be defined a
					// layer down ( core, theme, or user ).
					return getValueFromVariable( mergedStyles, context, value );
				}

				const value = get( mergedStyles?.styles, path );
				return getValueFromVariable( mergedStyles, context, value );
			},
			setStyle: ( context, propertyName, newValue ) => {
				const newContent = { ...userStyles };

				const path =
					ROOT_BLOCK_NAME === context
						? [ 'styles' ]
						: [ 'styles', 'blocks', context ];
				const propertyPath = STYLE_PROPERTY[ propertyName ].value;

				let newStyles = get( newContent, path );
				if ( ! newStyles ) {
					newStyles = {};
					set( newContent, path, newStyles );
				}
				set(
					newStyles,
					propertyPath,
					getPresetVariable(
						mergedStyles,
						context,
						propertyName,
						newValue
					)
				);

				setContent( JSON.stringify( newContent ) );
			},
		} ),
		[ content, mergedStyles, themeStyles ]
	);

	useEffect( () => {
		const nonGlobalStyles = settings.styles.filter(
			( style ) => ! style.isGlobalStyles
		);
		const customProperties = toCustomProperties( mergedStyles, blocks );
		const globalStyles = toStyles( mergedStyles, blocks );
		updateSettings( {
			...settings,
			styles: [
				...nonGlobalStyles,
				{
					css: customProperties,
					isGlobalStyles: true,
					__experimentalNoWrapper: true,
				},
				{
					css: globalStyles,
					isGlobalStyles: true,
				},
			],
			__experimentalFeatures: mergedStyles.settings,
		} );
	}, [ blocks, mergedStyles ] );

	return (
		<GlobalStylesContext.Provider value={ nextValue }>
			{ children }
		</GlobalStylesContext.Provider>
	);
}

/**
 * External dependencies
 */
import { get, cloneDeep, set, isEqual, has } from 'lodash';

/**
 * WordPress dependencies
 */
import { useMemo, useCallback } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { useEntityProp } from '@wordpress/core-data';
import {
	getBlockType,
	__EXPERIMENTAL_PATHS_WITH_MERGE as PATHS_WITH_MERGE,
	__EXPERIMENTAL_STYLE_PROPERTY as STYLE_PROPERTY,
} from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../store';

const EMPTY_CONFIG = { isGlobalStylesUserThemeJSON: true, version: 1 };

function useGlobalStylesUserConfig() {
	const globalStylesId = useSelect( ( select ) => {
		return select( editSiteStore ).getSettings()
			.__experimentalGlobalStylesUserEntityId;
	}, [] );

	const [ content, setContent ] = useEntityProp(
		'postType',
		'wp_global_styles',
		'content',
		globalStylesId
	);

	const config = useMemo( () => {
		let parsedConfig;
		try {
			parsedConfig = content ? JSON.parse( content ) : {};
		} catch ( e ) {
			/* eslint-disable no-console */
			console.error( 'Global Styles User data is not valid' );
			console.error( e );
			/* eslint-enable no-console */
			parsedConfig = {};
		}

		return parsedConfig;
	}, [ content ] );

	const setConfig = useCallback(
		( newConfig ) => setContent( JSON.stringify( newConfig ) ),
		[ setContent ]
	);

	return [ config, setConfig ];
}

function useGlobalStylesBaseConfig() {
	const baseConfig = useSelect( ( select ) => {
		return select( editSiteStore ).getSettings()
			.__experimentalGlobalStylesBaseStyles;
	}, [] );

	return baseConfig;
}

function useGlobalStylesConfig() {
	const [ userConfig, setUserConfig ] = useGlobalStylesUserConfig();
	const baseConfig = useGlobalStylesBaseConfig();

	return [ baseConfig, userConfig, setUserConfig ];
}

export const useGlobalStylesReset = () => {
	const [ config, setConfig ] = useGlobalStylesUserConfig();
	const canReset = !! config && ! isEqual( config, EMPTY_CONFIG );
	return [
		canReset,
		useCallback( () => setConfig( EMPTY_CONFIG ), [ setConfig ] ),
	];
};

export function useSetting( path, blockName, source = 'all' ) {
	const [ baseConfig, userConfig, setUserConfig ] = useGlobalStylesConfig();
	const finalPath = ! blockName
		? `settings.${ path }`
		: `settings.blocks.${ blockName }.${ path }`;

	const getBaseSetting = () => {
		const result = get( baseConfig, finalPath );
		if ( PATHS_WITH_MERGE[ path ] ) {
			return result.theme ?? result.core;
		}
	};

	const setSetting = ( newValue ) => {
		const newUserConfig = cloneDeep( userConfig );
		set( newUserConfig, finalPath, newValue );
		setUserConfig( newUserConfig );
	};

	let result;
	switch ( source ) {
		case 'all':
			result = get( userConfig, finalPath ) ?? getBaseSetting();
			break;
		case 'user':
			result = get( userConfig, finalPath );
			break;
		case 'base':
			result = getBaseSetting();
			break;
		default:
			throw 'Unsupported source';
	}

	return [ result, setSetting ];
}

export function useStyle( path, blockName, source = 'all' ) {
	const [ baseConfig, userConfig, setUserConfig ] = useGlobalStylesConfig();
	const finalPath = ! blockName
		? `styles.${ path }`
		: `styles.blocks.${ blockName }.${ path }`;

	const setStyle = ( newValue ) => {
		const newUserConfig = cloneDeep( userConfig );
		set( newUserConfig, finalPath, newValue );
		setUserConfig( newUserConfig );
	};

	let result;
	switch ( source ) {
		case 'all':
			result =
				get( userConfig, finalPath ) ?? get( baseConfig, finalPath );
			break;
		case 'user':
			result = get( userConfig, finalPath );
			break;
		case 'base':
			result = get( baseConfig, finalPath );
			break;
		default:
			throw 'Unsupported source';
	}

	return [ result, setStyle ];
}

const ROOT_BLOCK_SUPPORTS = [
	'background',
	'backgroundColor',
	'color',
	'linkColor',
	'fontFamily',
	'fontSize',
	'fontStyle',
	'fontWeight',
	'lineHeight',
	'textDecoration',
	'textTransform',
	'padding',
];

export function getSupportedGlobalStylesPanels( name ) {
	if ( ! name ) {
		return ROOT_BLOCK_SUPPORTS;
	}

	const blockType = getBlockType( name );

	if ( ! blockType ) {
		return [];
	}

	const supportKeys = [];
	Object.keys( STYLE_PROPERTY ).forEach( ( styleName ) => {
		if ( ! STYLE_PROPERTY[ styleName ].support ) {
			return;
		}

		// Opting out means that, for certain support keys like background color,
		// blocks have to explicitly set the support value false. If the key is
		// unset, we still enable it.
		if ( STYLE_PROPERTY[ name ].requiresOptOut ) {
			if (
				has(
					blockType.supports,
					STYLE_PROPERTY[ name ].support[ 0 ]
				) &&
				get( blockType.supports, STYLE_PROPERTY[ name ].support ) !==
					false
			) {
				return supportKeys.push( name );
			}
		}

		if (
			get( blockType.supports, STYLE_PROPERTY[ name ].support, false )
		) {
			return supportKeys.push( name );
		}
	} );

	return supportKeys;
}

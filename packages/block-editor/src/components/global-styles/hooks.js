/**
 * External dependencies
 */
import fastDeepEqual from 'fast-deep-equal/es6';
import { get, set } from 'lodash';

/**
 * WordPress dependencies
 */
import { useContext, useCallback, useMemo } from '@wordpress/element';
import { __EXPERIMENTAL_PATHS_WITH_MERGE as PATHS_WITH_MERGE } from '@wordpress/blocks';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { getValueFromVariable, getPresetVariableFromValue } from './utils';
import { GlobalStylesContext } from './context';
import { store as blockEditorStore } from '../../store';

const EMPTY_CONFIG = { settings: {}, styles: {} };

export const useGlobalStylesReset = () => {
	const { user: config, setUserConfig } = useContext( GlobalStylesContext );
	const canReset = !! config && ! fastDeepEqual( config, EMPTY_CONFIG );
	return [
		canReset,
		useCallback(
			() => setUserConfig( () => EMPTY_CONFIG ),
			[ setUserConfig ]
		),
	];
};

function cloneDeep( object ) {
	return JSON.parse( JSON.stringify( object ) );
}

export function useGlobalSetting( path, blockName, source = 'all' ) {
	const blockEditorSettings = useSelect(
		( select ) => select( blockEditorStore ).getSettings(),
		[]
	);

	const {
		base: baseConfig,
		user: userConfig,
		setUserConfig,
	} = useContext( GlobalStylesContext );

	const contextualPath = blockName ? `blocks.${ blockName }.${ path }` : path;

	let setting;

	if ( source === 'all' ) {
		setting =
			get( blockEditorSettings.__experimentalFeatures, contextualPath ) ??
			get( blockEditorSettings.__experimentalFeatures, path );
	} else if ( source === 'base' ) {
		setting =
			get( baseConfig.settings, contextualPath ) ??
			get( baseConfig.settings, path );
	} else if ( source === 'user' ) {
		setting =
			get( userConfig.settings, contextualPath ) ??
			get( userConfig.settings, path );
	} else {
		throw new Error( 'Invalid source' );
	}

	if ( PATHS_WITH_MERGE[ path ] ) {
		setting = setting?.custom ?? setting?.theme ?? setting?.default;
	}

	const setSetting = useCallback(
		( newValue ) => {
			setUserConfig( ( currentUserConfig ) => {
				const newUserConfig = cloneDeep( currentUserConfig );
				const pathToSet = PATHS_WITH_MERGE[ path ]
					? `settings.${ contextualPath }.custom`
					: `settings.${ contextualPath }`;
				set( newUserConfig, pathToSet, newValue );
				return newUserConfig;
			} );
		},
		[ setUserConfig, path, contextualPath ]
	);

	return [ setting, setSetting ];
}

export function useGlobalStyle( path, blockName, source = 'all' ) {
	const blockEditorSettings = useSelect(
		( select ) => select( blockEditorStore ).getSettings(),
		[]
	);

	const {
		base: baseConfig,
		user: userConfig,
		setUserConfig,
	} = useContext( GlobalStylesContext );

	const contextualPath = blockName ? `blocks.${ blockName }.${ path }` : path;

	// TODO:
	//  should 'base' refer to the block editor settings?
	//  then we just have 'user' from the context and 'all' is merging the two together?
	//  what about settings?

	const style = useMemo( () => {
		const mergedConfig = {
			styles: blockEditorSettings.__experimentalStyles,
			settings: blockEditorSettings.__experimentalFeatures,
		};
		if ( source === 'all' ) {
			return getValueFromVariable(
				mergedConfig,
				blockName,
				get( userConfig.styles, contextualPath ) ??
					get(
						blockEditorSettings.__experimentalStyles,
						contextualPath
					)
			);
		} else if ( source === 'base' ) {
			return getValueFromVariable(
				mergedConfig,
				blockName,
				get( blockEditorSettings.__experimentalStyles, contextualPath )
			);
		} else if ( source === 'user' ) {
			return getValueFromVariable(
				mergedConfig,
				blockName,
				get( userConfig.styles, contextualPath )
			);
		}
		throw new Error( 'Invalid source' );
	}, [
		blockEditorSettings,
		source,
		blockName,
		contextualPath,
		baseConfig,
		userConfig,
	] );

	const setStyle = useCallback(
		( newValue ) => {
			setUserConfig( ( currentUserConfig ) => {
				const newUserConfig = cloneDeep( currentUserConfig );
				set(
					newUserConfig,
					`styles.${ contextualPath }`,
					getPresetVariableFromValue(
						blockEditorSettings.__experimentalFeatures,
						blockName,
						path,
						newValue
					)
				);
				return newUserConfig;
			} );
		},
		[
			setUserConfig,
			contextualPath,
			blockEditorSettings.__experimentalFeatures,
			blockName,
			path,
		]
	);

	return [ style, setStyle ];
}

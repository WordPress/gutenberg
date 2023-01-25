/**
 * External dependencies
 */
import fastDeepEqual from 'fast-deep-equal/es6';
import { get, set, mergeWith } from 'lodash';

/**
 * WordPress dependencies
 */
import { useContext, useCallback } from '@wordpress/element';
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
	const { userConfig, setUserConfig } = useContext( GlobalStylesContext );
	const canReset =
		!! userConfig && ! fastDeepEqual( userConfig, EMPTY_CONFIG );
	return [
		canReset,
		useCallback(
			() => setUserConfig( () => EMPTY_CONFIG ),
			[ setUserConfig ]
		),
	];
};

function mergeConfigs( base, user ) {
	return mergeWith( {}, base, user, ( _, srcValue ) => {
		// We only pass as arrays the presets, in which case we want the new
		// array of values to override the old array (no merging).
		if ( Array.isArray( srcValue ) ) {
			return srcValue;
		}
	} );
}

function cloneDeep( object ) {
	return JSON.parse( JSON.stringify( object ) );
}

export function useGlobalSetting( path, blockName, source = 'all' ) {
	const blockEditorSettings = useSelect(
		( select ) => select( blockEditorStore ).getSettings(),
		[]
	);

	const { userConfig, setUserConfig } = useContext( GlobalStylesContext );

	// TODO: Add memoization.
	const mergedSettings = mergeConfigs(
		blockEditorSettings.__experimentalFeatures,
		userConfig.settings
	);

	const contextualPath = blockName
		? `blocks.${ blockName }.${ path }`
		: `${ path }`;

	let setting;

	if ( source === 'all' ) {
		setting =
			get( mergedSettings, contextualPath ) ??
			get( mergedSettings, path );
	} else if ( source === 'user' ) {
		setting =
			get( userConfig.settings, contextualPath ) ??
			get( userConfig.settings, path );
	} else if ( source === 'base' ) {
		setting =
			get( blockEditorSettings.__experimentalFeatures, contextualPath ) ??
			get( blockEditorSettings.__experimentalFeatures, path );
	} else {
		throw new Error( 'Invalid source' );
	}

	if ( PATHS_WITH_MERGE[ path ] ) {
		setting = setting?.custom ?? setting?.theme ?? setting?.default;
	}

	const setSetting = ( newValue ) => {
		setUserConfig( ( currentUserConfig ) => {
			const newUserConfig = cloneDeep( currentUserConfig );
			const pathToSet = PATHS_WITH_MERGE[ path ]
				? `settings.${ contextualPath }.custom`
				: `settings.${ contextualPath }`;
			set( newUserConfig, pathToSet, newValue );
			return newUserConfig;
		} );
	};

	return [ setting, setSetting ];
}

export function useGlobalStyle( path, blockName, source = 'all' ) {
	const blockEditorSettings = useSelect(
		( select ) => select( blockEditorStore ).getSettings(),
		[]
	);

	const { userConfig, setUserConfig } = useContext( GlobalStylesContext );

	// TODO: Can probably do away with this object if we change
	// getValueFromVariable() to accept config.settings, not config.
	const baseConfig = {
		styles: blockEditorSettings.__experimentalStyles,
		settings: blockEditorSettings.__experimentalFeatures,
	};

	// TODO: Add memoization.
	const mergedConfig = mergeConfigs( baseConfig, userConfig );

	const contextualPath = blockName ? `blocks.${ blockName }.${ path }` : path;

	let style;

	if ( source === 'all' ) {
		style = getValueFromVariable(
			mergedConfig,
			blockName,
			// The styles.css path is allowed to be empty, so don't revert to base if undefined.
			contextualPath === 'styles.css'
				? get( userConfig, `styles.${ contextualPath }` )
				: get( userConfig, `styles.${ contextualPath }` ) ??
						get( baseConfig, `styles.${ contextualPath }` )
		);
	} else if ( source === 'user' ) {
		style = getValueFromVariable(
			mergedConfig,
			blockName,
			get( userConfig, `styles.${ contextualPath }` )
		);
	} else if ( source === 'base' ) {
		style = getValueFromVariable(
			baseConfig,
			blockName,
			get( baseConfig, `styles.${ contextualPath }` )
		);
	} else {
		throw new Error( 'Invalid source' );
	}

	const setStyle = ( newValue ) => {
		setUserConfig( ( currentUserConfig ) => {
			const newUserConfig = cloneDeep( currentUserConfig );
			set(
				newUserConfig,
				`styles.${ contextualPath }`,
				getPresetVariableFromValue(
					mergedConfig.settings,
					blockName,
					path,
					newValue
				)
			);
			return newUserConfig;
		} );
	};

	return [ style, setStyle ];
}

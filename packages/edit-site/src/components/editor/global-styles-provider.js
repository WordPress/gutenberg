/**
 * External dependencies
 */
import { set, get, mapValues, mergeWith } from 'lodash';

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
	store as blocksStore,
} from '@wordpress/blocks';
import { useEntityProp } from '@wordpress/core-data';
import { useSelect, useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import {
	GLOBAL_CONTEXT_NAME,
	GLOBAL_CONTEXT_SELECTOR,
	GLOBAL_CONTEXT_SUPPORTS,
	getValueFromVariable,
	getPresetVariable,
} from './utils';
import getGlobalStyles from './global-styles-renderer';

const EMPTY_CONTENT = '{}';

const GlobalStylesContext = createContext( {
	/* eslint-disable no-unused-vars */
	getSetting: ( context, path ) => {},
	setSetting: ( context, path, newValue ) => {},
	getStyle: ( context, propertyName, origin ) => {},
	setStyle: ( context, propertyName, newValue ) => {},
	contexts: {},
	/* eslint-enable no-unused-vars */
} );

const mergeTreesCustomizer = ( objValue, srcValue ) => {
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
	const canRestart = !! content && content !== EMPTY_CONTENT;
	return [
		canRestart,
		useCallback( () => setContent( EMPTY_CONTENT ), [ setContent ] ),
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

const getContexts = ( blockTypes ) => {
	const result = {
		[ GLOBAL_CONTEXT_NAME ]: {
			selector: GLOBAL_CONTEXT_SELECTOR,
			supports: GLOBAL_CONTEXT_SUPPORTS,
		},
	};

	// Add contexts from block metadata.
	blockTypes.forEach( ( blockType ) => {
		const blockName = blockType.name;
		const blockSelector = blockType?.supports?.__experimentalSelector;
		const supports = extractSupportKeys( blockType?.supports );
		const hasSupport = supports.length > 0;

		if ( hasSupport && typeof blockSelector === 'string' ) {
			result[ blockName ] = {
				selector: blockSelector,
				supports,
				blockName,
			};
		} else if ( hasSupport && typeof blockSelector === 'object' ) {
			Object.keys( blockSelector ).forEach( ( key ) => {
				result[ key ] = {
					selector: blockSelector[ key ].selector,
					supports,
					blockName,
					title: blockSelector[ key ].title,
					attributes: blockSelector[ key ].attributes,
				};
			} );
		} else if ( hasSupport ) {
			const suffix = blockName.replace( 'core/', '' ).replace( '/', '-' );
			result[ blockName ] = {
				selector: '.wp-block-' + suffix,
				supports,
				blockName,
			};
		}
	} );

	return result;
};

export default function GlobalStylesProvider( { children, baseStyles } ) {
	const [ content, setContent ] = useGlobalStylesEntityContent();
	const { blockTypes, settings } = useSelect( ( select ) => {
		return {
			blockTypes: select( blocksStore ).getBlockTypes(),
			settings: select( 'core/edit-site' ).getSettings(),
		};
	} );
	const { updateSettings } = useDispatch( 'core/edit-site' );

	const contexts = useMemo( () => getContexts( blockTypes ), [ blockTypes ] );

	const { userStyles, mergedStyles } = useMemo( () => {
		const newUserStyles = content ? JSON.parse( content ) : {};
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
			contexts,
			getSetting: ( context, path ) =>
				get( userStyles?.[ context ]?.settings, path ),
			setSetting: ( context, path, newValue ) => {
				const newContent = { ...userStyles };
				let contextSettings = newContent?.[ context ]?.settings;
				if ( ! contextSettings ) {
					contextSettings = {};
					set( newContent, [ context, 'settings' ], contextSettings );
				}
				set( contextSettings, path, newValue );
				setContent( JSON.stringify( newContent ) );
			},
			getStyle: ( context, propertyName, origin = 'merged' ) => {
				const styles = 'user' === origin ? userStyles : mergedStyles;

				const value = get(
					styles?.[ context ]?.styles,
					STYLE_PROPERTY[ propertyName ].value
				);
				return getValueFromVariable( mergedStyles, context, value );
			},
			setStyle: ( context, propertyName, newValue ) => {
				const newContent = { ...userStyles };
				let contextStyles = newContent?.[ context ]?.styles;
				if ( ! contextStyles ) {
					contextStyles = {};
					set( newContent, [ context, 'styles' ], contextStyles );
				}
				set(
					contextStyles,
					STYLE_PROPERTY[ propertyName ].value,
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
		[ content, mergedStyles ]
	);

	useEffect( () => {
		const newStyles = settings.styles.filter(
			( style ) => ! style.isGlobalStyles
		);
		updateSettings( {
			...settings,
			styles: [
				...newStyles,
				{
					css: getGlobalStyles(
						contexts,
						mergedStyles,
						'cssVariables'
					),
					isGlobalStyles: true,
					__experimentalNoWrapper: true,
				},
				{
					css: getGlobalStyles(
						contexts,
						mergedStyles,
						'blockStyles'
					),
					isGlobalStyles: true,
				},
			],
			__experimentalFeatures: mapValues(
				mergedStyles,
				( value ) => value?.settings || {}
			),
		} );
	}, [ contexts, mergedStyles ] );

	return (
		<GlobalStylesContext.Provider value={ nextValue }>
			{ children }
		</GlobalStylesContext.Provider>
	);
}

/**
 * External dependencies
 */
import { mergeWith, isEmpty, mapValues } from 'lodash';

/**
 * WordPress dependencies
 */
import { useMemo, useCallback } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import BlockGlobalStylesContext from './context';
import { store as blockEditorStore } from '../../store';

function mergeTreesCustomizer( _, srcValue ) {
	// We only pass as arrays the presets,
	// in which case we want the new array of values
	// to override the old array (no merging).
	if ( Array.isArray( srcValue ) ) {
		return srcValue;
	}
}

export function mergeBaseAndUserConfigs( base, user ) {
	return mergeWith( {}, base, user, mergeTreesCustomizer );
}

function cleanEmptyObject( object ) {
	if (
		object === null ||
		typeof object !== 'object' ||
		Array.isArray( object )
	) {
		return object;
	}
	const cleanedNestedObjects = Object.fromEntries(
		Object.entries( mapValues( object, cleanEmptyObject ) ).filter(
			( [ , value ] ) => Boolean( value )
		)
	);
	return isEmpty( cleanedNestedObjects ) ? undefined : cleanedNestedObjects;
}

function useBaseBlockGlobalStyles( blockName ) {
	const baseConfig = useSelect( ( select ) => {
		return select(
			coreStore
		).__experimentalGetCurrentThemeBaseGlobalStyles();
	}, [] );

	return [ !! baseConfig, baseConfig?.styles?.blocks?.[ blockName ] || {} ];
}

function useUserBlockGlobalStyles() {
	const { globalStylesId, blockName, styles } = useSelect( ( select ) => {
		const _globalStylesId =
			select( coreStore ).__experimentalGetCurrentGlobalStylesId();
		const record = _globalStylesId
			? select( coreStore ).getEditedEntityRecord(
					'root',
					'globalStyles',
					_globalStylesId
			  )
			: undefined;
		const { getBlockName, getSelectedBlockClientId } =
			select( blockEditorStore );
		const selectedBlockClientId = getSelectedBlockClientId();
		const selectedBlockName =
			selectedBlockClientId && getBlockName( selectedBlockClientId );
		return {
			globalStylesId: _globalStylesId,
			blockName: selectedBlockName,
			styles: record?.styles,
		};
	}, [] );

	const { getEditedEntityRecord } = useSelect( coreStore );
	const { editEntityRecord } = useDispatch( coreStore );
	const isReady = !! styles || !! blockName;

	const setBlockGlobalStyles = useCallback(
		( callback ) => {
			const record = getEditedEntityRecord(
				'root',
				'globalStyles',
				globalStylesId
			);
			const currentBlockStyles = record?.styles?.[ blockName ] ?? {};
			const updatedBlockStyles =
				cleanEmptyObject( callback( currentBlockStyles ) ) || {};
			editEntityRecord( 'root', 'globalStyles', globalStylesId, {
				styles: {
					...record?.styles,
					blocks: {
						...record?.styles?.blocks,
						[ blockName ]: updatedBlockStyles,
					},
				},
			} );
		},
		[ globalStylesId ]
	);

	return [
		isReady,
		blockName,
		styles?.blocks?.[ blockName ] || {},
		setBlockGlobalStyles,
	];
}

function useBlockGlobalStylesContext() {
	const [
		areUserBlockGlobalStylesReady,
		blockName,
		userBlockStyles,
		setUserBlockStyles,
	] = useUserBlockGlobalStyles();

	const [ areBaseBlockGlobalStylesReady, baseBlockStyles ] =
		useBaseBlockGlobalStyles( blockName );

	const mergedBlockStyles = useMemo( () => {
		if ( ! baseBlockStyles || ! userBlockStyles ) {
			return {};
		}
		return mergeBaseAndUserConfigs( baseBlockStyles, userBlockStyles );
	}, [ userBlockStyles, baseBlockStyles ] );

	const context = useMemo( () => {
		return {
			isReady:
				areUserBlockGlobalStylesReady && areBaseBlockGlobalStylesReady,
			user: userBlockStyles,
			base: baseBlockStyles,
			merged: mergedBlockStyles,
			setUserBlockStyles,
		};
	}, [ mergedBlockStyles, baseBlockStyles, userBlockStyles ] );
	return context;
}

export default function BlockGlobalStylesProvider( { children } ) {
	const context = useBlockGlobalStylesContext();
	if ( ! context.isReady ) {
		return null;
	}

	return (
		<BlockGlobalStylesContext.Provider value={ context }>
			{ children }
		</BlockGlobalStylesContext.Provider>
	);
}

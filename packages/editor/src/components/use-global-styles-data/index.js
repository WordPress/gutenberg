/**
 * External dependencies
 */
import deepmerge from 'deepmerge';
import { isPlainObject } from 'is-plain-object';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { store as coreStore } from '@wordpress/core-data';

const DEFAULT_STYLES = {};

function useGlobalStylesBaseData() {
	const baseConfig = useSelect( ( select ) => {
		return select(
			coreStore
		).__experimentalGetCurrentThemeBaseGlobalStyles();
	}, [] );

	return [ !! baseConfig, baseConfig?.styles ?? DEFAULT_STYLES ];
}

function useGlobalStylesUserData() {
	return useSelect( ( select ) => {
		const {
			getEditedEntityRecord,
			hasFinishedResolution,
			__experimentalGetCurrentGlobalStylesId,
		} = select( coreStore );

		const globalStylesId = __experimentalGetCurrentGlobalStylesId();
		const record = globalStylesId
			? getEditedEntityRecord( 'root', 'globalStyles', globalStylesId )
			: undefined;

		let hasResolved = false;
		if (
			hasFinishedResolution( '__experimentalGetCurrentGlobalStylesId' )
		) {
			hasResolved = globalStylesId
				? hasFinishedResolution( 'getEditedEntityRecord', [
						'root',
						'globalStyles',
						globalStylesId,
				  ] )
				: true;
		}

		return [ hasResolved, record?.styles ?? DEFAULT_STYLES ];
	}, [] );
}

function mergeBaseAndUserStyles( base, user ) {
	return deepmerge( base, user, {
		// We only pass as arrays the presets,
		// in which case we want the new array of values
		// to override the old array (no merging).
		isMergeableObject: isPlainObject,
	} );
}

export function useGlobalStylesData() {
	const [ isBaseStylesReady, baseStyles ] = useGlobalStylesBaseData();
	const [ isUserStylesReady, userStyles ] = useGlobalStylesUserData();
	const mergedStyles = useMemo(
		() => mergeBaseAndUserStyles( baseStyles, userStyles ),
		[ baseStyles, userStyles ]
	);

	return {
		isReady: isBaseStylesReady && isUserStylesReady,
		styles: mergedStyles,
	};
}

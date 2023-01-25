/**
 * External dependencies
 */
import { isEmpty, mapValues } from 'lodash';

/**
 * WordPress dependencies
 */
import { useMemo, useCallback } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { experiments as blockEditorExperiments } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import CanvasSpinner from '../canvas-spinner';
import { unlock } from '../../experiments';

const { GlobalStylesContext } = unlock( blockEditorExperiments );

const cleanEmptyObject = ( object ) => {
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
};

function useGlobalStylesContext() {
	const { globalStylesId, isReady, settings, styles } = useSelect(
		( select ) => {
			const { getEditedEntityRecord, hasFinishedResolution } =
				select( coreStore );
			const _globalStylesId =
				select( coreStore ).__experimentalGetCurrentGlobalStylesId();
			const record = _globalStylesId
				? getEditedEntityRecord(
						'root',
						'globalStyles',
						_globalStylesId
				  )
				: undefined;

			let hasResolved = false;
			if (
				hasFinishedResolution(
					'__experimentalGetCurrentGlobalStylesId'
				)
			) {
				hasResolved = _globalStylesId
					? hasFinishedResolution( 'getEditedEntityRecord', [
							'root',
							'globalStyles',
							_globalStylesId,
					  ] )
					: true;
			}

			return {
				globalStylesId: _globalStylesId,
				isReady: hasResolved,
				settings: record?.settings,
				styles: record?.styles,
			};
		},
		[]
	);

	const { getEditedEntityRecord } = useSelect( coreStore );
	const { editEntityRecord } = useDispatch( coreStore );
	const userConfig = useMemo( () => {
		return {
			settings: settings ?? {},
			styles: styles ?? {},
		};
	}, [ settings, styles ] );

	const setUserConfig = useCallback(
		( callback, options = {} ) => {
			const record = getEditedEntityRecord(
				'root',
				'globalStyles',
				globalStylesId
			);
			const currentConfig = {
				styles: record?.styles ?? {},
				settings: record?.settings ?? {},
			};
			const updatedConfig = callback( currentConfig );
			editEntityRecord(
				'root',
				'globalStyles',
				globalStylesId,
				{
					styles: cleanEmptyObject( updatedConfig.styles ) || {},
					settings: cleanEmptyObject( updatedConfig.settings ) || {},
				},
				options
			);
		},
		[ globalStylesId ]
	);

	return { isReady, userConfig, setUserConfig };
}

export function GlobalStylesProvider( { children } ) {
	const context = useGlobalStylesContext();
	if ( ! context.isReady ) {
		return <CanvasSpinner />;
	}

	return (
		<GlobalStylesContext.Provider value={ context }>
			{ children }
		</GlobalStylesContext.Provider>
	);
}

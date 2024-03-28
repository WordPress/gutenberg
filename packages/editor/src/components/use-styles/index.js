/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

export function useStyles() {
	const { styles, isReady } = useSelect( ( select ) => {
		const { getEditedEntityRecord, hasFinishedResolution } =
			select( coreStore );
		const _globalStylesId =
			select( coreStore ).__experimentalGetCurrentGlobalStylesId();
		const record = _globalStylesId
			? getEditedEntityRecord( 'root', 'globalStyles', _globalStylesId )
			: undefined;

		let hasResolved = false;
		if (
			hasFinishedResolution( '__experimentalGetCurrentGlobalStylesId' )
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
			isReady: hasResolved,
			styles: record?.styles,
		};
	}, [] );

	// Make sure to recompute the styles when hasResolved changes.
	const config = useMemo( () => {
		return {
			styles: styles ?? {},
			isReady,
		};
	}, [ isReady, styles ] );

	return config;
}

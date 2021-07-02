/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import type { Context } from 'react';
import { CacheProvider, EmotionCache } from '@emotion/react';
import type { SerializedStyles } from '@emotion/serialize';
import { insertStyles } from '@emotion/utils';
// eslint-disable-next-line no-restricted-imports
import { cx as innerCx, ClassNamesArg } from '@emotion/css';

/**
 * WordPress dependencies
 */
import { useContext, useCallback } from '@wordpress/element';

// @ts-ignore Private property
const EmotionCacheContext: Context< EmotionCache > = CacheProvider._context;

const useEmotionCacheContext = () => useContext( EmotionCacheContext );

const isSerializedStyles = ( o: any ): o is SerializedStyles =>
	[ 'name', 'styles' ].every( ( p ) => typeof o[ p ] !== 'undefined' );

export const useCx = () => {
	const cache = useEmotionCacheContext();

	const cx = useCallback(
		( ...classNames: ( ClassNamesArg | SerializedStyles )[] ) => {
			return innerCx(
				...classNames.map( ( arg ) => {
					if ( isSerializedStyles( arg ) ) {
						insertStyles( cache, arg, false );
						return `${ cache.key }-${ arg.name }`;
					}
					return arg;
				} )
			);
		},
		[ cache ]
	);

	return cx;
};

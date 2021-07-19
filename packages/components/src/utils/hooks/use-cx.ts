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
	// eslint-disable-next-line eqeqeq
	o != null &&
	[ 'name', 'styles' ].every( ( p ) => typeof o[ p ] !== 'undefined' );

/**
 * Retrieve a `cx` function that knows how to handle `SerializedStyles`
 * returned by the `@emotion/react` `css` function in addition to what
 * `cx` normally knows how to handle. It also hooks into the Emotion
 * Cache, allowing `css` calls to work inside iframes.
 *
 * @example
 * import { css } from '@emotion/react';
 *
 * const styles = css`
 * 	color: red
 * `;
 *
 * function RedText( { className, ...props } ) {
 * 	const cx = useCx();
 *
 * 	const classes = cx(styles, className);
 *
 * 	return <span className={classes} {...props} />;
 * }
 */
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

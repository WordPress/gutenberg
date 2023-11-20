/**
 * External dependencies
 */
import { __unsafe_useEmotionCache as useEmotionCache } from '@emotion/react';
import type { SerializedStyles } from '@emotion/serialize';
import { insertStyles } from '@emotion/utils';
// eslint-disable-next-line no-restricted-imports
import type { ClassNamesArg } from '@emotion/css';
// eslint-disable-next-line no-restricted-imports
import { cx as innerCx } from '@emotion/css';

/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';

const isSerializedStyles = ( o: any ): o is SerializedStyles =>
	typeof o !== 'undefined' &&
	o !== null &&
	[ 'name', 'styles' ].every( ( p ) => typeof o[ p ] !== 'undefined' );

/**
 * Retrieve a `cx` function that knows how to handle `SerializedStyles`
 * returned by the `@emotion/react` `css` function in addition to what
 * `cx` normally knows how to handle. It also hooks into the Emotion
 * Cache, allowing `css` calls to work inside iframes.
 *
 * ```jsx
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
 * ```
 */
export const useCx = () => {
	const cache = useEmotionCache();

	const cx = useCallback(
		( ...classNames: ( ClassNamesArg | SerializedStyles )[] ) => {
			if ( cache === null ) {
				throw new Error(
					'The `useCx` hook should be only used within a valid Emotion Cache Context'
				);
			}

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

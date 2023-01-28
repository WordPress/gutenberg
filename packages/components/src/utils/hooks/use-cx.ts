/**
 * External dependencies
 */
import { __unsafe_useEmotionCache as useEmotionCache } from '@emotion/react';
import type { SerializedStyles } from '@emotion/serialize';
import { insertStyles } from '@emotion/utils';
// eslint-disable-next-line no-restricted-imports
import { cx as innerCx } from '@emotion/css';

/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';

const isSerializedStyles = ( o: any ): o is SerializedStyles =>
	typeof o !== 'undefined' &&
	o !== null &&
	typeof o.name !== 'undefined' &&
	typeof o.styles !== 'undefined';

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
	const cache = useEmotionCache();

	const cx = useCallback(
		function () {
			if ( cache === null ) {
				throw new Error(
					'The `useCx` hook should be only used within a valid Emotion Cache Context'
				);
			}

			let classNames = null;
			for ( let i = 0; i < arguments.length; i++ ) {
				// eslint-disable-next-line prefer-rest-params
				if ( isSerializedStyles( arguments[ i ] ) ) {
					// eslint-disable-next-line prefer-rest-params
					insertStyles( cache, arguments[ i ], false );
					// eslint-disable-next-line prefer-rest-params
					classNames = Array.prototype.slice.call( arguments, 0, i );
					classNames.push(
						// eslint-disable-next-line prefer-rest-params
						`${ cache.key }-${ arguments[ i ].name }`
					);
					continue;
				}

				if ( null !== classNames ) {
					// eslint-disable-next-line prefer-rest-params
					classNames.push( arguments[ i ] );
				}
			}

			// eslint-disable-next-line prefer-spread
			return innerCx.apply(
				null,
				// @ts-ignore
				// eslint-disable-next-line prefer-rest-params
				null === classNames ? arguments : classNames
			);
		},
		[ cache ]
	);

	return cx;
};

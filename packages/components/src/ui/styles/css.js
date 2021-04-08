/**
 * External dependencies
 */
import { isPlainObject } from 'lodash';

/**
 * Internal dependencies
 */
import { INTERPOLATION_CLASS_NAME, responsive } from '../create-styles';
import { space } from './mixins/space';
import { compiler } from './system';
const { css: compile } = compiler;

// Inspired by:
// https://github.com/system-ui/theme-ui/blob/master/packages/css/src/index.ts

export const scales = {
	gridGap: 'space',
	gridColumnGap: 'space',
	gridRowGap: 'space',
	gap: 'space',
	columnGap: 'space',
	rowGap: 'space',
};

const transformFns = {
	space,
};

/**
 * Retrieves a scaled values from the Style system based on a style key.
 *
 * @param {string} key The style key to scale.
 * @param {any} value The style value to scale.
 * @return {any} The scaled value.
 */
export function getScaleValue( key, value ) {
	const scale = scales[ /** @type {keyof scales} */ ( key ) ];
	let next = value;

	if ( scale ) {
		const transformFn =
			transformFns[ /** @type {keyof transformFns} */ ( scale ) ];
		if ( transformFns ) {
			next = transformFn( value );
		}
	}

	return next;
}

/**
 * Transform a style object with scaled values from the Style system.
 *
 * @param {import('@emotion/serialize').ObjectInterpolation<any>} styles The style object to transform.
 * @return {import('@emotion/serialize').ObjectInterpolation<any>} The style object with scaled values.
 */
export function getScaleStyles( styles = {} ) {
	/** @type {Record<string, string>} */
	const next = {};

	for ( const k in styles ) {
		next[ k ] = getScaleValue( k, styles[ k ] );
	}

	return next;
}

/* eslint-disable jsdoc/valid-types */
/**
 * @param {any} value
 * @return {value is import('@wp-g2/create-styles').PolymorphicComponent<any, any>} Whether interpolation is a PolymorphicComponent.
 */
function isPolymorphicComponent( value ) {
	/* eslint-enable jsdoc/valid-types */
	return value && typeof value[ INTERPOLATION_CLASS_NAME ] !== 'undefined';
}

/* eslint-disable jsdoc/no-undefined-types */
/**
 * Enhances the (create-system enhanced) CSS function to account for
 * scale functions within the Style system.
 *
 * @param {TemplateStringsArray | import('create-emotion').Interpolation<undefined>} template
 * @param {(import('create-emotion').Interpolation<undefined> | import('@wp-g2/create-styles').PolymorphicComponent<any, any>)[]} args The styles to compile.
 * @return {ReturnType<compile>} The compiled styles.
 */
export function css( template, ...args ) {
	/* eslint-enable jsdoc/no-undefined-types */
	if ( isPlainObject( template ) ) {
		return compile(
			getScaleStyles(
				responsive(
					/** @type {ObjectInterpolation} */ ( template ),
					getScaleValue
				)
			)
		);
	}

	if ( Array.isArray( template ) ) {
		for ( let i = 0, len = template.length; i < len; i++ ) {
			const n = template[ i ];

			if ( isPlainObject( n ) ) {
				template[ i ] = getScaleStyles(
					responsive(
						/** @type {ObjectInterpolation} */ ( n ),
						getScaleValue
					)
				);
			}
		}

		const nextArgs = args.map( ( arg ) => {
			if ( ! arg ) {
				return arg;
			}

			if ( isPolymorphicComponent( arg ) ) {
				return `.${ arg[ INTERPOLATION_CLASS_NAME ] }`;
			}

			return arg;
		} );

		return compile( template, ...nextArgs );
	}

	// @ts-ignore Emotion says `css` doesn't take `TemplateStringsArray` but it does!
	return compile( template, ...args );
}

/** @typedef {import('create-emotion').ObjectInterpolation<any>} ObjectInterpolation */

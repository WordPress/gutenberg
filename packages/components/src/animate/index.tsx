/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import type { AnimateOptions, AnimateType, AnimateProps } from './types';

/* eslint-disable jsdoc/valid-types */
/**
 * @return {'top' | 'left'} Default origin
 */
function getDefaultOrigin( type: AnimateType ) {
	return type === 'appear' ? 'top' : 'left';
}
/* eslint-enable jsdoc/valid-types */

/**
 * @return {string | void} ClassName that applies the animations
 */
export function getAnimateClassName( options: AnimateOptions ): string {
	if ( options.type === 'loading' ) {
		return classnames( 'components-animate__loading' );
	}

	const { type, origin = getDefaultOrigin( type ) } = options;

	if ( type === 'appear' ) {
		const [ yAxis, xAxis = 'center' ] = origin.split( ' ' );
		return classnames( 'components-animate__appear', {
			[ 'is-from-' + xAxis ]: xAxis !== 'center',
			[ 'is-from-' + yAxis ]: yAxis !== 'middle',
		} );
	}

	if ( type === 'slide-in' ) {
		return classnames(
			'components-animate__slide-in',
			'is-from-' + origin
		);
	}
	return '';
}

export default function Animate( {
	type,
	// @ts-ignore Reason: Planned for deprecation
	options = {},
	children,
}: AnimateProps ) {
	return children( {
		className: getAnimateClassName( { type, ...options } ),
	} );
}

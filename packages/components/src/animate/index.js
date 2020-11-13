/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import deprecated from '@wordpress/deprecated';

/**
 * @typedef {'top' | 'top left' | 'top right' | 'middle' | 'middle left' | 'middle right' | 'bottom' | 'bottom left' | 'bottom right'} AppearOrigin
 * @typedef {'left' | 'right'} SlideInOrigin
 * @typedef {{type: 'appear'; origin?: AppearOrigin}} AppearOptions
 * @typedef {{type: 'slide-in'; origin?: SlideInOrigin}} SlideInOptions
 * @typedef {{type: 'loading'}} LoadingOptions
 * @typedef {AppearOptions|SlideInOptions|LoadingOptions} UseAnimateOptions
 */

/* eslint-disable jsdoc/valid-types */
/**
 * @param {UseAnimateOptions['type']} type The animation type
 * @return {'top'|'left'} Default origin
 */
function getDefaultOrigin( type ) {
	return type === 'appear' ? 'top' : 'left';
}
/* eslint-enable jsdoc/valid-types */

/**
 * @param {UseAnimateOptions} options
 * @return {string | undefined} Classname that applies the animations
 */
export function useAnimate( options ) {
	const { type } = options;
	if ( type === 'loading' ) {
		return classnames( 'components-animate__loading' );
	}

	const {
		origin = getDefaultOrigin( type ),
	} = /** @type {AppearOptions|SlideInOptions} */ ( options );

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

	return undefined;
}

/**
 *
 * @todo Remove options when deprecated handling has been removed.
 *
 * @param {{options?: any; children: (props: {className?: string})=> JSX.Element;} & UseAnimateOptions} props
 * @return {JSX.Element} Element
 */
export default function Animate( {
	type,
	options: _deprecatedOptions,
	children,
	...options
} ) {
	if ( Boolean( _deprecatedOptions ) ) {
		deprecated( '<Animate /> options prop', {
			version: '9.6',
			hint: 'Pass options directly as props instead.',
		} );
	}
	return children( {
		className: useAnimate( { type, ..._deprecatedOptions, ...options } ),
	} );
}

/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * @typedef {'top' | 'top left' | 'top right' | 'bottom' | 'bottom left' | 'bottom right'} AppearOrigin
 */
/**
 * @typedef {'appear' | 'loading' | 'slide-in'} Type
 */
/**
 * @typedef {'left' | 'right'} SlideInOrigin
 */

/**
 * @param {Type} type The animation type
 * @return {'top'|'left'} Default origin
 */
function getDefaultOrigin( type ) {
	return type === 'appear' ? 'top' : 'left';
}

/**
 * @typedef AppearOptions
 * @property {'appear'} type The type of animation.
 * @property {AppearOrigin} origin The origin of the appearance.
 */

/**
 * @typedef SlideInOptions
 * @property {'slide-in'} type The type of animation.
 * @property {SlideInOrigin} origin The origin of the appearance.
 */

/**
 * @typedef LoadingOptions
 * @property {'loading'} type The type of animation.
 * @property {never} origin .
 */

/**
 * @param {AppearOptions | SlideInOptions | LoadingOptions} options
 * @return {string | undefined} Classname that applies the animations
 */
export function useAnimate( { type, origin = getDefaultOrigin( type ) } ) {
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

	if ( type === 'loading' ) {
		return classnames( 'components-animate__loading' );
	}

	return undefined;
}

/**
 * @typedef AppearPropsOptions
 * @property {AppearOrigin} origin The origin of the appearance.
 */

/**
 * @typedef SlideInPropsOptions
 * @property {SlideInOrigin} origin The origin of the appearance.
 */

/**
 * @typedef ChildrenProps
 * @property {string} className Classnames for the animation.
 */

/**
 * @callback children
 * @param {ChildrenProps} props
 * @return {JSX.Element}
 */

/**
 * @typedef AppearProps
 * @property {'appear'} type The animation type.
 * @property {AppearPropsOptions} options Options for the animation.
 * @property {children} children Children as a function.
 */

/**
 * @typedef SlideInProps
 * @property {'slide-in'} type The animation type.
 * @property {SlideInPropsOptions} options Options for the animation.
 * @property {children} children Children as a function.
 */

/**
 * @typedef LoadingProps
 * @property {'loading'} type The animation type.
 * @property {never} options Unused options
 * @property {children} children Children as a function.
 */

/**
 * @param {AppearProps | SlideInProps | LoadingProps} props Props.
 * @return {JSX.Element} Element.
 */
export default function Animate( { type, options, children } ) {
	return children( {
		className: useAnimate( { type, ...( options || {} ) } ),
	} );
}

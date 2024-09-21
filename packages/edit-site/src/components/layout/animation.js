/**
 * WordPress dependencies
 */
import { useLayoutEffect, useMemo, useRef } from '@wordpress/element';

const ANIMATION_DURATION = 400;

/**
 * Animates an element’s placement.
 *
 * It works on the FLIP principle:
 * [First, Last, Invert, Play](https://aerotwist.com/blog/flip-your-animations/)
 *
 * @param {Object} $1                          Options
 * @param {*}      $1.triggerAnimationOnChange Variable whose changes trigger the animation.
 */
function useMovingAnimation( { triggerAnimationOnChange } ) {
	const ref = useRef();

	// Whenever the trigger changes, takes a snapshot of the current rectangle.
	const from = useMemo(
		() => ref.current?.getBoundingClientRect(),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[ triggerAnimationOnChange ]
	);

	useLayoutEffect( () => {
		if (
			! from ||
			! ref.current ||
			! ref.current.animate || // Avoid errors on old UAs.
			window.matchMedia( '(prefers-reduced-motion: reduce)' ).matches // They prefer not.
		) {
			return;
		}

		const animationConfig = flipBox(
			{ from, to: ref.current.getBoundingClientRect() },
			{ duration: ANIMATION_DURATION, easing: quintInOut }
		);

		const control = animate( ref.current, animationConfig );
		return () => control.cancel();
	}, [ from ] );

	return ref;
}

export default useMovingAnimation;

/** @param {number} t */
const linear = ( t ) => t;

/** @param {number} t */
const quintInOut = ( t ) =>
	( t *= 2 ) < 1
		? 0.5 * t * t * t * t * t
		: 0.5 * ( ( t -= 2 ) * t * t * t * t + 2 );

/**
 * @param {string} style
 */
function propertyToCamelCase( style ) {
	const parts = style.split( '-' );
	if ( parts.length === 1 ) {
		return parts[ 0 ];
	}
	return (
		parts[ 0 ] +
		parts
			.slice( 1 )
			.map(
				/** @param {any} word */ ( word ) =>
					word[ 0 ].toUpperCase() + word.slice( 1 )
			)
			.join( '' )
	);
}

/**
 * @param {string} css
 */
function asKeyframes( css ) {
	// eslint-disable-next-line jsdoc/no-undefined-types
	/** @type {Keyframe} */
	const keyframe = {};
	const parts = css.split( ';' );
	for ( const part of parts ) {
		const [ property, value ] = part.split( ':' );
		if ( ! property || value === undefined ) {
			break;
		}

		keyframe[ propertyToCamelCase( property.trim() ) ] = value.trim();
	}
	return keyframe;
}

/**
 * Animates an element, according to the provided configuration.
 * @param {Element}                  element
 * @param {AnimationConfig}          config
 * @param {number}                   target   The target progression — `1` is end, `0` is beginning.
 * @param {(() => void) | undefined} callback
 */
const animate = ( element, config, target = 1, callback ) => {
	const { delay = 0, duration = 300, css, easing = linear } = config;

	const origin = 1 - target;
	const delta = target - origin;
	const resolvedDuration = duration * Math.abs( delta );

	const keyframes = [];
	// `n` must be an integer to ensure a finish accurate to the `target` value.
	const n = Math.ceil( resolvedDuration / ( 1000 / 60 ) );

	// Generates keyframes ahead of time. Doing so supports custom easing functions.
	// Otherwise, if using standard easing functions the plaform’s animate would need
	// only the final keyframe. (Well, to avoid an error on some older browsers the
	// first keyframe is required too.)
	for ( let i = 0; i <= n; i += 1 ) {
		const t = origin + delta * easing( i / n );
		const styles = css( t, 1 - t );
		keyframes.push( asKeyframes( styles ) );
	}

	const animation = element.animate( keyframes, {
		delay,
		duration: resolvedDuration,
		easing: 'linear', // The actual easing was baked into the keyframes.
	} );

	animation.finished
		.then( () => {
			callback?.();

			if ( target === 1 ) {
				animation.cancel();
			}
		} )
		.catch( ( e ) => {
			// Error for DOMException: The user aborted a request. This results in two things:
			// - startTime is `null`
			// - currentTime is `null`
			// We can't use the existence of an AbortError as this error and error code is shared
			// with other Web APIs such as fetch().

			if (
				animation.startTime !== null &&
				animation.currentTime !== null
			) {
				throw e;
			}
		} );

	return animation;
};

/**
 * @typedef AnimationConfig
 * @property {number}                           [delay]    Time before the animation begins in milliseconds.
 * @property {number}                           [duration] Time between the animation’s beginning and end in milliseconds.
 * @property {(t: number) => number}            [easing]   Function to modify the acceleration curve of the animation.
 * @property {(t: number, u: number) => string} css        Function to compute the CSS rules at a point in the animation’s progression.
 */

/**
 * @typedef FlipParams
 * @property {number}                             [delay]    Time before the animation begins in milliseconds.
 * @property {number | ((len: number) => number)} [duration] Time between the animation’s beginning and end in milliseconds.
 * @property {(t: number) => number}              [easing]   Function to modify the acceleration curve of the animation.
 */

/**
 * Provides an animation configuration for animating an element’s placement.
 * Adapted from Svelte:
 * https://github.com/sveltejs/svelte/blob/main/packages/svelte/src/animate/index.js
 * This animates width and height instead of scale as the original does.
 * @param {{ from: DOMRect; to: DOMRect }} fromTo
 * @param {FlipParams}                     params
 */
const flipBox = ( { from, to }, params = {} ) => {
	const dx = from.left - to.left;
	const dy = from.top - to.top;
	const dw = from.width - to.width;
	const dh = from.height - to.height;
	const {
		delay = 0,
		duration = ( d ) => Math.sqrt( d ) * 120,
		easing = linear,
	} = params;
	return /** @type {AnimationConfig} */ ( {
		delay,
		duration:
			typeof duration === 'function'
				? duration( Math.sqrt( dx * dx + dy * dy ) )
				: duration,
		easing,
		css: ( t, u ) => {
			const x = u * dx;
			const y = u * dy;
			const w = u * dw + to.width;
			const h = u * dh + to.height;
			return `transform: translate3d(${ x }px, ${ y }px,0); width: ${ w }px; height: ${ h }px;`;
		},
	} );
};

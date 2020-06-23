/**
 * External dependencies
 */
import { useSpring } from 'react-spring/web.cjs';

/**
 * WordPress dependencies
 */
import {
	useState,
	useLayoutEffect,
	useReducer,
	useRef,
} from '@wordpress/element';
import { useReducedMotion } from '@wordpress/compose';
import { getScrollContainer } from '@wordpress/dom';

/**
 * Simple reducer used to increment a counter.
 *
 * @param {number} state  Previous counter value.
 * @return {number} New state value.
 */
const counterReducer = ( state ) => state + 1;

const getAbsolutePosition = ( element ) => {
	return {
		top: element.offsetTop,
		left: element.offsetLeft,
	};
};

/**
 * Hook used to compute the styles required to move a div into a new position.
 *
 * The way this animation works is the following:
 *  - It first renders the element as if there was no animation.
 *  - It takes a snapshot of the position of the block to use it
 *    as a destination point for the animation.
 *  - It restores the element to the previous position using a CSS transform
 *  - It uses the "resetAnimation" flag to reset the animation
 *    from the beginning in order to animate to the new destination point.
 *
 * @param {Object}  ref                      Reference to the element to animate.
 * @param {boolean} isSelected               Whether it's the current block or not.
 * @param {boolean} adjustScrolling          Adjust the scroll position to the current block.
 * @param {boolean} enableAnimation          Enable/Disable animation.
 * @param {*}       triggerAnimationOnChange Variable used to trigger the animation if it changes.
 */
function useMovingAnimation(
	ref,
	isSelected,
	adjustScrolling,
	enableAnimation,
	triggerAnimationOnChange
) {
	const prefersReducedMotion = useReducedMotion() || ! enableAnimation;
	const [ triggeredAnimation, triggerAnimation ] = useReducer(
		counterReducer,
		0
	);
	const [ finishedAnimation, endAnimation ] = useReducer( counterReducer, 0 );
	const [ transform, setTransform ] = useState( {
		x: 0,
		y: 0,
		clientTop: 0,
	} );

	const previous = ref.current ? getAbsolutePosition( ref.current ) : null;
	const scrollContainer = useRef();
	const prevX = useRef( 0 );
	const prevY = useRef( 0 );

	useLayoutEffect( () => {
		if ( triggeredAnimation ) {
			endAnimation();
		}
	}, [ triggeredAnimation ] );
	useLayoutEffect( () => {
		if ( ! previous ) {
			return;
		}

		scrollContainer.current = getScrollContainer( ref.current );

		if ( prefersReducedMotion ) {
			if ( adjustScrolling && scrollContainer.current ) {
				// if the animation is disabled and the scroll needs to be adjusted,
				// just move directly to the final scroll position
				ref.current.style.transform = '';
				const destination = getAbsolutePosition( ref.current );
				scrollContainer.current.scrollTop =
					scrollContainer.current.scrollTop -
					previous.top +
					destination.top;
			}

			return;
		}

		ref.current.style.transform = '';
		const destination = getAbsolutePosition( ref.current );
		const x = Math.round( previous.left - destination.left );
		const y = Math.round( previous.top - destination.top );
		ref.current.style.transform =
			x === 0 && y === 0 ? '' : `translate3d(${ x }px,${ y }px,0)`;
		const blockRect = ref.current.getBoundingClientRect();
		const newTransform = {
			x,
			y,
			clientTop: blockRect.top,
		};
		prevX.current = x;
		prevY.current = y;
		triggerAnimation();
		setTransform( newTransform );
	}, [ triggerAnimationOnChange ] );

	useSpring( {
		from: {
			x: transform.x,
			y: transform.y,
		},
		to: {
			x: 0,
			y: 0,
		},
		reset: triggeredAnimation !== finishedAnimation,
		config: { mass: 5, tension: 2000, friction: 200 },
		immediate: prefersReducedMotion,
		onFrame( { x, y } ) {
			if ( ref.current ) {
				x = Math.round( x );
				y = Math.round( y );
				ref.current.style.transformOrigin = 'center';
				ref.current.style.transform =
					x === 0 && y === 0
						? ''
						: `translate3d(${ x }px,${ y }px,0)`;
				ref.current.style.zIndex =
					! isSelected || ( x === 0 && y === 0 ) ? '' : '1';

				if (
					adjustScrolling &&
					scrollContainer.current &&
					! prefersReducedMotion &&
					y !== prevY.current
				) {
					const blockRect = ref.current.getBoundingClientRect();
					const diff = blockRect.top - transform.clientTop;

					if ( diff ) {
						scrollContainer.current.scrollTop += diff;
					}
				}

				prevX.current = x;
				prevY.current = y;
			}
		},
	} );
}

export default useMovingAnimation;

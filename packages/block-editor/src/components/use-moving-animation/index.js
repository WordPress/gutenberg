/**
 * External dependencies
 */
import { useSpring } from '@react-spring/web';

/**
 * WordPress dependencies
 */
import {
	useState,
	useLayoutEffect,
	useReducer,
	useMemo,
	useRef,
} from '@wordpress/element';
import { useReducedMotion } from '@wordpress/compose';
import { getScrollContainer } from '@wordpress/dom';

/**
 * Simple reducer used to increment a counter.
 *
 * @param {number} state Previous counter value.
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
 * @param {Object}  $1                          Options
 * @param {boolean} $1.isSelected               Whether it's the current block or not.
 * @param {boolean} $1.adjustScrolling          Adjust the scroll position to the current block.
 * @param {boolean} $1.enableAnimation          Enable/Disable animation.
 * @param {*}       $1.triggerAnimationOnChange Variable used to trigger the animation if it changes.
 */
function useMovingAnimation( {
	isSelected,
	adjustScrolling,
	enableAnimation,
	triggerAnimationOnChange,
} ) {
	const ref = useRef();
	const prefersReducedMotion = useReducedMotion() || ! enableAnimation;
	const [ triggeredAnimation, triggerAnimation ] = useReducer(
		counterReducer,
		0
	);
	const [ finishedAnimation, endAnimation ] = useReducer( counterReducer, 0 );
	const [ transform, setTransform ] = useState( { x: 0, y: 0 } );
	const previous = useMemo(
		() => ( ref.current ? getAbsolutePosition( ref.current ) : null ),
		[ triggerAnimationOnChange ]
	);

	// Calculate the previous position of the block relative to the viewport and
	// return a function to maintain that position by scrolling.
	const preserveScrollPosition = useMemo( () => {
		if ( ! adjustScrolling || ! ref.current ) {
			return () => {};
		}

		const scrollContainer = getScrollContainer( ref.current );

		if ( ! scrollContainer ) {
			return () => {};
		}

		const prevRect = ref.current.getBoundingClientRect();
		return () => {
			const blockRect = ref.current.getBoundingClientRect();
			const diff = blockRect.top - prevRect.top;

			if ( diff ) {
				scrollContainer.scrollTop += diff;
			}
		};
	}, [ triggerAnimationOnChange, adjustScrolling ] );

	useLayoutEffect( () => {
		if ( triggeredAnimation ) {
			endAnimation();
		}
	}, [ triggeredAnimation ] );
	useLayoutEffect( () => {
		if ( ! previous ) {
			return;
		}

		if ( prefersReducedMotion ) {
			// if the animation is disabled and the scroll needs to be adjusted,
			// just move directly to the final scroll position.
			preserveScrollPosition();

			return;
		}

		ref.current.style.transform = '';
		const destination = getAbsolutePosition( ref.current );

		triggerAnimation();
		setTransform( {
			x: Math.round( previous.left - destination.left ),
			y: Math.round( previous.top - destination.top ),
		} );
	}, [ triggerAnimationOnChange ] );

	// Only called when either the x or y value changes.
	function onFrameChange( { x, y } ) {
		if ( ! ref.current ) {
			return;
		}

		const isMoving = x === 0 && y === 0;
		ref.current.style.transformOrigin = isMoving ? '' : 'center';
		ref.current.style.transform = isMoving
			? ''
			: `translate3d(${ x }px,${ y }px,0)`;
		ref.current.style.zIndex = ! isSelected || isMoving ? '' : '1';

		preserveScrollPosition();
	}

	// Called for every frame computed by useSpring.
	function onChange( { value } ) {
		let { x, y } = value;
		x = Math.round( x );
		y = Math.round( y );

		if ( x !== onChange.x || y !== onChange.y ) {
			onFrameChange( { x, y } );
			onChange.x = x;
			onChange.y = y;
		}
	}

	onChange.x = 0;
	onChange.y = 0;

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
		onChange,
	} );

	return ref;
}

export default useMovingAnimation;

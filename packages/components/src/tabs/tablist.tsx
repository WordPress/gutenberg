/**
 * External dependencies
 */
import * as Ariakit from '@ariakit/react';

/**
 * WordPress dependencies
 */
import warning from '@wordpress/warning';
import {
	forwardRef,
	useCallback,
	useEffect,
	useInsertionEffect,
	useRef,
	useState,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { TabListProps } from './types';
import { useTabsContext } from './context';
import { TabListWrapper } from './styles';
import type { WordPressComponentProps } from '../context';
import clsx from 'clsx';

// TODO: move these into a separate utility file, for use in other components
// such as ToggleGroupControl.

/**
 * Any function.
 */
type AnyFunction = ( ...args: any ) => any;

/**
 * Creates a stable callback function that has access to the latest state and
 * can be used within event handlers and effect callbacks. Throws when used in
 * the render phase.
 *
 * @example
 *
 * ```tsx
 * function Component(props) {
 *   const onClick = useEvent(props.onClick);
 *   React.useEffect(() => {}, [onClick]);
 * }
 * ```
 */
function useEvent< T extends AnyFunction >( callback?: T ) {
	const ref = useRef< AnyFunction | undefined >( () => {
		throw new Error( 'Cannot call an event handler while rendering.' );
	} );
	useInsertionEffect( () => {
		ref.current = callback;
	} );
	return useCallback< AnyFunction >(
		( ...args ) => ref.current?.( ...args ),
		[]
	) as T;
}

/**
 * `useResizeObserver` options.
 */
type UseResizeObserverOptions = {
	/**
	 * Whether to trigger the callback when an element's ResizeObserver is
	 * first set up.
	 *
	 * @default true
	 */
	fireOnObserve?: boolean;
};

/**
 * Fires `onResize` when the target element is resized.
 *
 * **The element must not be stored in a ref**, else it won't be observed
 * or updated. Instead, it should be stored in a React state or equivalent.
 *
 * It sets up a `ResizeObserver` that tracks the element under the hood. The
 * target element can be changed dynamically, and the observer will be
 * updated accordingly.
 *
 * By default, `onResize` is called when the observer is set up, in addition
 * to when the element is resized. This behavior can be disabled with the
 * `fireOnObserve` option.
 *
 * @example
 *
 * ```tsx
 * const [ targetElement, setTargetElement ] = useState< HTMLElement | null >();
 *
 * useResizeObserver( targetElement, ( element ) => {
 *   console.log( 'Element resized:', element );
 * } );
 *
 * <div ref={ setTargetElement } />;
 * ```
 */
function useResizeObserver(
	/**
	 * The target element to observe. It can be changed dynamically.
	 */
	targetElement: HTMLElement | undefined | null,

	/**
	 * Callback to fire when the element is resized. It will also be
	 * called when the observer is set up, unless `fireOnObserve` is
	 * set to `false`.
	 */
	onResize: ( element: HTMLElement ) => void,
	{ fireOnObserve = true }: UseResizeObserverOptions = {}
) {
	const onResizeEvent = useEvent( onResize );

	const observedElementRef = useRef< HTMLElement | null >();
	const resizeObserverRef = useRef< ResizeObserver >();

	useEffect( () => {
		if ( targetElement === observedElementRef.current ) {
			return;
		}

		observedElementRef.current = targetElement;

		// Set up a ResizeObserver.
		if ( ! resizeObserverRef.current ) {
			resizeObserverRef.current = new ResizeObserver( () => {
				if ( observedElementRef.current ) {
					onResizeEvent( observedElementRef.current );
				}
			} );
		}
		const { current: resizeObserver } = resizeObserverRef;

		// Observe new element.
		if ( targetElement ) {
			if ( fireOnObserve ) {
				onResizeEvent( targetElement );
			}
			resizeObserver.observe( targetElement );
		}

		return () => {
			// Unobserve previous element.
			if ( observedElementRef.current ) {
				resizeObserver.unobserve( observedElementRef.current );
			}
		};
	}, [ fireOnObserve, onResizeEvent, targetElement ] );
}

/**
 * The position and dimensions of an element, relative to its offset parent.
 */
type ElementOffsetRect = {
	/**
	 * The distance from the left edge of the offset parent to the left edge of
	 * the element.
	 */
	left: number;
	/**
	 * The distance from the top edge of the offset parent to the top edge of
	 * the element.
	 */
	top: number;
	/**
	 * The width of the element.
	 */
	width: number;
	/**
	 * The height of the element.
	 */
	height: number;
};

/**
 * An `ElementOffsetRect` object with all values set to zero.
 */
const NULL_ELEMENT_OFFSET_RECT = {
	left: 0,
	top: 0,
	width: 0,
	height: 0,
} satisfies ElementOffsetRect;

/**
 * Returns the position and dimensions of an element, relative to its offset
 * parent. This is useful in contexts where `getBoundingClientRect` is not
 * suitable, such as when the element is transformed.
 *
 * **Note:** the `left` and `right` values are adjusted due to a limitation
 * in the way the browser calculates the offset position of the element,
 * which can cause unwanted scrollbars to appear. This adjustment makes the
 * values potentially inaccurate within a range of 1 pixel.
 */
function getElementOffsetRect( element: HTMLElement ): ElementOffsetRect {
	return {
		// The adjustments mentioned in the documentation above are necessary
		// because `offsetLeft` and `offsetTop` are rounded to the nearest pixel,
		// which can result in a position mismatch that causes unwanted overflow.
		// For context, see: https://github.com/WordPress/gutenberg/pull/61979
		left: Math.max( element.offsetLeft - 1, 0 ),
		top: Math.max( element.offsetTop - 1, 0 ),
		// This is a workaround to obtain these values with a sub-pixel precision,
		// since `offsetWidth` and `offsetHeight` are rounded to the nearest pixel.
		width: parseFloat( getComputedStyle( element ).width ),
		height: parseFloat( getComputedStyle( element ).height ),
	};
}

/**
 * Tracks the position and dimensions of an element, relative to its offset
 * parent. The element can be changed dynamically.
 */
function useTrackElementOffsetRect(
	targetElement: HTMLElement | undefined | null
) {
	const [ indicatorPosition, setIndicatorPosition ] =
		useState< ElementOffsetRect >( NULL_ELEMENT_OFFSET_RECT );

	useResizeObserver( targetElement, ( element ) =>
		setIndicatorPosition( getElementOffsetRect( element ) )
	);

	return indicatorPosition;
}

/**
 * Context object for the `onUpdate` callback of `useOnValueUpdate`.
 */
type ValueUpdateContext< T > = {
	previousValue: T;
};

/**
 * Calls the `onUpdate` callback when the `value` changes.
 */
function useOnValueUpdate< T >(
	/**
	 * The value to watch for changes.
	 */
	value: T,
	/**
	 * Callback to fire when the value changes.
	 */
	onUpdate: ( context: ValueUpdateContext< T > ) => void
) {
	const previousValueRef = useRef( value );
	const updateCallbackEvent = useEvent( onUpdate );
	useEffect( () => {
		if ( previousValueRef.current !== value ) {
			updateCallbackEvent( {
				previousValue: previousValueRef.current,
			} );
			previousValueRef.current = value;
		}
	}, [ updateCallbackEvent, value ] );
}

export const TabList = forwardRef<
	HTMLDivElement,
	WordPressComponentProps< TabListProps, 'div', false >
>( function TabList( { children, ...otherProps }, ref ) {
	const context = useTabsContext();

	const selectedId = context?.store.useState( 'selectedId' );
	const indicatorPosition = useTrackElementOffsetRect(
		context?.store.item( selectedId )?.element
	);

	const [ animationEnabled, setAnimationEnabled ] = useState( false );
	useOnValueUpdate(
		selectedId,
		( { previousValue } ) => previousValue && setAnimationEnabled( true )
	);

	if ( ! context ) {
		warning( '`Tabs.TabList` must be wrapped in a `Tabs` component.' );
		return null;
	}
	const { store } = context;

	const { activeId, selectOnMove } = store.useState();
	const { setActiveId } = store;

	const onBlur = () => {
		if ( ! selectOnMove ) {
			return;
		}

		// When automatic tab selection is on, make sure that the active tab is up
		// to date with the selected tab when leaving the tablist. This makes sure
		// that the selected tab will receive keyboard focus when tabbing back into
		// the tablist.
		if ( selectedId !== activeId ) {
			setActiveId( selectedId );
		}
	};

	return (
		<Ariakit.TabList
			ref={ ref }
			store={ store }
			render={
				<TabListWrapper
					onTransitionEnd={ ( event ) => {
						if ( event.pseudoElement === '::after' ) {
							setAnimationEnabled( false );
						}
					} }
				/>
			}
			onBlur={ onBlur }
			{ ...otherProps }
			style={ {
				'--indicator-left': `${ indicatorPosition.left }px`,
				'--indicator-top': `${ indicatorPosition.top }px`,
				'--indicator-width': `${ indicatorPosition.width }px`,
				'--indicator-height': `${ indicatorPosition.height }px`,
				...otherProps.style,
			} }
			className={ clsx(
				animationEnabled ? 'is-animation-enabled' : '',
				otherProps.className
			) }
		>
			{ children }
		</Ariakit.TabList>
	);
} );

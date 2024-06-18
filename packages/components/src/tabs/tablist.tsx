/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import * as Ariakit from '@ariakit/react';

/**
 * WordPress dependencies
 */
import warning from '@wordpress/warning';
import {
	forwardRef,
	useEffect,
	useLayoutEffect,
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

function useTrackElementOffset(
	targetElement?: HTMLElement | null,
	onUpdate?: () => void
) {
	const [ indicatorPosition, setIndicatorPosition ] = useState( {
		left: 0,
		top: 0,
		width: 0,
		height: 0,
	} );

	// TODO: replace with useEventCallback or similar when officially available.
	const updateCallbackRef = useRef( onUpdate );
	useLayoutEffect( () => {
		updateCallbackRef.current = onUpdate;
	} );

	const observedElementRef = useRef< HTMLElement >();
	const resizeObserverRef = useRef< ResizeObserver >();
	useEffect( () => {
		if ( targetElement === observedElementRef.current ) {
			return;
		}

		observedElementRef.current = targetElement ?? undefined;

		function updateIndicator( element: HTMLElement ) {
			setIndicatorPosition( {
				// Workaround to prevent unwanted scrollbars, see:
				// https://github.com/WordPress/gutenberg/pull/61979
				left: Math.max( element.offsetLeft - 1, 0 ),
				top: Math.max( element.offsetTop - 1, 0 ),
				width: parseFloat( getComputedStyle( element ).width ),
				height: parseFloat( getComputedStyle( element ).height ),
			} );
			updateCallbackRef.current?.();
		}

		// Set up a ResizeObserver.
		if ( ! resizeObserverRef.current ) {
			resizeObserverRef.current = new ResizeObserver( () => {
				if ( observedElementRef.current ) {
					updateIndicator( observedElementRef.current );
				}
			} );
		}
		const { current: resizeObserver } = resizeObserverRef;

		// Observe new element.
		if ( targetElement ) {
			updateIndicator( targetElement );
			resizeObserver.observe( targetElement );
		}

		return () => {
			// Unobserve previous element.
			if ( observedElementRef.current ) {
				resizeObserver.unobserve( observedElementRef.current );
			}
		};
	}, [ targetElement ] );

	return indicatorPosition;
}

type ValueUpdateContext< T > = {
	previousValue: T;
};

function useOnValueUpdate< T >(
	value: T,
	onUpdate: ( context: ValueUpdateContext< T > ) => void
) {
	const previousValueRef = useRef( value );

	// TODO: replace with useEventCallback or similar when officially available.
	const updateCallbackRef = useRef( onUpdate );
	useLayoutEffect( () => {
		updateCallbackRef.current = onUpdate;
	} );

	useEffect( () => {
		if ( previousValueRef.current !== value ) {
			updateCallbackRef.current( {
				previousValue: previousValueRef.current,
			} );
			previousValueRef.current = value;
		}
	}, [ value ] );
}

export const TabList = forwardRef<
	HTMLDivElement,
	WordPressComponentProps< TabListProps, 'div', false >
>( function TabList( { children, ...otherProps }, ref ) {
	const context = useTabsContext();

	const selectedId = context?.store.useState( 'selectedId' );
	const indicatorPosition = useTrackElementOffset(
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

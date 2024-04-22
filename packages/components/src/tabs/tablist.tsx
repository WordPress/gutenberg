/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import * as Ariakit from '@ariakit/react';

/**
 * WordPress dependencies
 */
import warning from '@wordpress/warning';
import { forwardRef, useEffect, useRef, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { TabListProps } from './types';
import { useTabsContext } from './context';
import { TabListWrapper } from './styles';
import type { WordPressComponentProps } from '../context';
import type { CSSProperties } from 'react';

export const TabList = forwardRef<
	HTMLDivElement,
	WordPressComponentProps< TabListProps, 'div', false >
>( function TabList( { children, ...otherProps }, ref ) {
	const context = useTabsContext();

	const [ indicatorPosition, setIndicatorPosition ] = useState( {
		left: 0,
		width: 0,
	} );
	const selectedId = context?.store.useState( 'selectedId' );
	const selectedTabEl = context?.store.item( selectedId )?.element;
	const resizeObserverRef = useRef< ResizeObserver >();
	const observedElementRef = useRef< HTMLElement >();

	useEffect( () => {
		if ( selectedTabEl === observedElementRef.current ) return;
		observedElementRef.current = selectedTabEl ?? undefined;

		function updateIndicator( element: HTMLElement ) {
			setIndicatorPosition( {
				left: element.offsetLeft,
				width: element.getBoundingClientRect().width,
			} );
		}

		// Set up a ResizeObserver.
		if ( ! resizeObserverRef.current ) {
			resizeObserverRef.current = new ResizeObserver( () => {
				if ( observedElementRef.current )
					updateIndicator( observedElementRef.current );
			} );
		}
		const { current: resizeObserver } = resizeObserverRef;

		// Unobserve previous element.
		const { current: observedElement } = observedElementRef;
		if ( observedElement ) resizeObserver.unobserve( observedElement );

		// Observe new element.
		if ( selectedTabEl ) {
			updateIndicator( selectedTabEl );
			resizeObserver.observe( selectedTabEl );
		}
	}, [ selectedTabEl ] );

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
			style={
				{
					'--indicator-left': `${ indicatorPosition.left }px`,
					'--indicator-width': `${ indicatorPosition.width }px`,
				} as CSSProperties
			}
			render={ <TabListWrapper /> }
			onBlur={ onBlur }
			{ ...otherProps }
		>
			{ children }
		</Ariakit.TabList>
	);
} );

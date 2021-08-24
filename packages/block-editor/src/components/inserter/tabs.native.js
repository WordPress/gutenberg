/**
 * External dependencies
 */
import { Animated, View } from 'react-native';

/**
 * WordPress dependencies
 */
import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { SegmentedControl } from '@wordpress/components';

/**
 * Internal dependencies
 */
import BlockTypesTab from './block-types-tab';
import ReusableBlocksTab from './reusable-blocks-tab';
import styles from './style.scss';

const TAB_ANIMATION_DURATION = 250;

function InserterTabs( {
	listProps,
	onSelect,
	rootClientId,
	showReusableBlocks,
	tabIndex,
} ) {
	const tabAnimation = useRef( new Animated.Value( 0 ) ).current;
	const lastScrollEvents = useRef( [] ).current;
	const [ wrapperWidth, setWrapperWidth ] = useState( 0 );

	function onScroll( event ) {
		lastScrollEvents[ tabIndex ] = event.nativeEvent;
		listProps.onScroll( event );
	}

	const onWrapperLayout = useCallback(
		( { nativeEvent } ) => {
			setWrapperWidth( nativeEvent.layout.width );
		},
		[ setWrapperWidth ]
	);

	useEffect( () => {
		Animated.timing( tabAnimation, {
			duration: TAB_ANIMATION_DURATION,
			toValue: tabIndex,
			useNativeDriver: true,
		} ).start();

		// Notify upstream with the last scroll event of the current tab.
		const lastScrollEvent = lastScrollEvents[ tabIndex ];
		if ( lastScrollEvent ) {
			listProps.onScroll( { nativeEvent: lastScrollEvent } );
		}
	}, [ tabIndex ] );

	const { tabs, tabKeys } = useMemo( () => {
		const filteredTabs = InserterTabs.TABS.filter(
			( { name } ) => showReusableBlocks || name !== 'reusable'
		);
		return {
			tabs: filteredTabs,
			tabKeys: [ ...filteredTabs.keys() ],
		};
	}, [ showReusableBlocks ] );

	const translateX = useMemo(
		() =>
			tabKeys.length > 1
				? tabAnimation.interpolate( {
						inputRange: tabKeys,
						outputRange: tabKeys.map(
							( key ) => key * -wrapperWidth
						),
				  } )
				: tabAnimation,
		[ tabAnimation, tabKeys, wrapperWidth ]
	);

	const containerStyle = [
		styles[ 'inserter-tabs__container' ],
		{
			width: wrapperWidth * tabKeys.length,
			transform: [ { translateX } ],
		},
	];

	return (
		<View
			style={ styles[ 'inserter-tabs__wrapper' ] }
			onLayout={ onWrapperLayout }
		>
			<Animated.View style={ containerStyle }>
				{ tabs.map( ( { component: TabComponent }, index ) => (
					<View
						key={ `tab-${ index }` }
						style={ [
							styles[ 'inserter-tabs__item' ],
							{ left: index * wrapperWidth },
						] }
					>
						<TabComponent
							rootClientId={ rootClientId }
							onSelect={ onSelect }
							listProps={ { ...listProps, onScroll } }
						/>
					</View>
				) ) }
			</Animated.View>
		</View>
	);
}

function TabsControl( { onChangeTab, showReusableBlocks } ) {
	const segments = useMemo( () => {
		const filteredTabs = InserterTabs.TABS.filter(
			( { name } ) => showReusableBlocks || name !== 'reusable'
		);
		return filteredTabs.map( ( { title } ) => title );
	}, [ showReusableBlocks ] );

	const segmentHandler = useCallback(
		( selectedTab ) => {
			const tabTitles = InserterTabs.TABS.map( ( { title } ) => title );
			onChangeTab( tabTitles.indexOf( selectedTab ) );
		},
		[ onChangeTab ]
	);

	return segments.length > 1 ? (
		<SegmentedControl
			segments={ segments }
			segmentHandler={ segmentHandler }
		/>
	) : null;
}

InserterTabs.Control = TabsControl;

InserterTabs.TABS = [
	{ name: 'blocks', title: __( 'Blocks' ), component: BlockTypesTab },
	{ name: 'reusable', title: __( 'Reusable' ), component: ReusableBlocksTab },
];

export default InserterTabs;

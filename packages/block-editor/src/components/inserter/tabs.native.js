/**
 * External dependencies
 */
import { Animated, Dimensions, View } from 'react-native';

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
	const [ windowWidth, setWindowWidth ] = useState(
		Dimensions.get( 'window' ).width
	);
	const tabAnimation = useRef( new Animated.Value( 0 ) ).current;
	const lastScrollEvents = useRef( [] ).current;

	useEffect( () => {
		Dimensions.addEventListener( 'change', onDimensionsChange );
		return () =>
			Dimensions.removeEventListener( 'change', onDimensionsChange );
	}, [] );

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
							( key ) => key * -windowWidth
						),
				  } )
				: tabAnimation,
		[ tabAnimation, tabKeys, windowWidth ]
	);

	function onScroll( event ) {
		lastScrollEvents[ tabIndex ] = event.nativeEvent;
		listProps.onScroll( event );
	}

	function onDimensionsChange() {
		setWindowWidth( Dimensions.get( 'window' ).width );
	}

	return (
		<View style={ styles[ 'inserter-tabs__wrapper' ] }>
			<Animated.View
				style={ [
					styles[ 'inserter-tabs__container' ],
					{
						width: windowWidth * tabKeys.length,
						transform: [ { translateX } ],
					},
				] }
			>
				{ tabs.map( ( tab, index ) => (
					<View
						key={ `tab-${ index }` }
						style={ [
							styles[ 'inserter-tabs__item' ],
							{ left: index * windowWidth },
						] }
					>
						{ tab.component( {
							rootClientId,
							onSelect,
							listProps: { ...listProps, onScroll },
						} ) }
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

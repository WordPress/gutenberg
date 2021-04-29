/**
 * External dependencies
 */
import { Animated, Dimensions, View } from 'react-native';

/**
 * WordPress dependencies
 */
import { useEffect, useRef, useMemo, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { SegmentedControl } from '@wordpress/components';

/**
 * Internal dependencies
 */
import BlocksTypesTab from './blocks-types-tab';
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

	useEffect( () => {
		Animated.timing( tabAnimation, {
			duration: TAB_ANIMATION_DURATION,
			toValue: tabIndex,
			useNativeDriver: true,
		} ).start();
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

	const { width } = Dimensions.get( 'window' );
	const translateX = useMemo(
		() =>
			tabKeys.length > 1
				? tabAnimation.interpolate( {
						inputRange: tabKeys,
						outputRange: tabKeys.map( ( key ) => key * -width ),
				  } )
				: tabAnimation,
		[ tabAnimation, tabKeys ]
	);

	return (
		<Animated.View
			style={ [
				styles[ 'inserter-tabs__container' ],
				{
					width: width * tabKeys.length,
					transform: [ { translateX } ],
				},
			] }
		>
			{ tabs.map( ( tab, index ) => (
				<View
					key={ `tab-${ index }` }
					style={ [
						styles[ 'inserter-tabs__item' ],
						{ left: index * width },
					] }
				>
					{ tab.component( {
						rootClientId,
						onSelect,
						listProps,
					} ) }
				</View>
			) ) }
		</Animated.View>
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
	{ name: 'blocks', title: __( 'Blocks' ), component: BlocksTypesTab },
	{ name: 'reusable', title: __( 'Reusable' ), component: ReusableBlocksTab },
];

export default InserterTabs;

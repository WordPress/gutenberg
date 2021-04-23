/**
 * External dependencies
 */
import { Animated, View } from 'react-native';

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

function InserterTab( {
	index,
	opacityAnimation,
	selected,
	tabProps,
	tabComponent,
} ) {
	const tabKeys = [ ...InserterTabs.TABS.keys() ];
	const opacity = opacityAnimation.interpolate( {
		inputRange: tabKeys,
		outputRange: tabKeys.map( ( key ) => ( key === index ? 1 : 0 ) ),
	} );

	return (
		<Animated.View
			pointerEvents={ selected ? 'auto' : 'none' }
			style={ [ styles[ 'inserter-tabs__item' ], { opacity } ] }
		>
			{ tabComponent( tabProps ) }
		</Animated.View>
	);
}

function InserterTabs( { rootClientId, tabIndex, onSelect, listProps } ) {
	const opacity = useRef( new Animated.Value( 0 ) ).current;

	useEffect( () => {
		Animated.timing( opacity, {
			duration: 250,
			toValue: tabIndex,
			useNativeDriver: true,
		} ).start();
	}, [ tabIndex ] );

	const tabProps = {
		rootClientId,
		onSelect,
		listProps,
	};

	return (
		<View style={ styles[ 'inserter-tabs__container' ] }>
			{ InserterTabs.TABS.map( ( tab, index ) => (
				<InserterTab
					key={ tab.name }
					index={ index }
					opacityAnimation={ opacity }
					selected={ tabIndex === index }
					tabComponent={ tab.component }
					tabProps={ tabProps }
				/>
			) ) }
		</View>
	);
}

function TabsControl( { onChangeTab } ) {
	const segments = useMemo(
		() => InserterTabs.TABS.map( ( { name } ) => name ),
		[]
	);

	const segmentHandler = useCallback(
		( selectedTab ) => {
			const tabNames = InserterTabs.TABS.map( ( { name } ) => name );
			onChangeTab( tabNames.indexOf( selectedTab ) );
		},
		[ onChangeTab ]
	);

	return (
		<SegmentedControl
			segments={ segments }
			segmentHandler={ segmentHandler }
		/>
	);
}

InserterTabs.Control = TabsControl;

InserterTabs.TABS = [
	{ name: __( 'Blocks' ), component: BlocksTypesTab },
	{ name: __( 'Reusable' ), component: ReusableBlocksTab },
];

export default InserterTabs;

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

function InserterTabs( { rootClientId, tabIndex, onSelect, listProps } ) {
	const tabAnimation = useRef( new Animated.Value( 0 ) ).current;

	useEffect( () => {
		Animated.timing( tabAnimation, {
			duration: TAB_ANIMATION_DURATION,
			toValue: tabIndex,
			useNativeDriver: true,
		} ).start();
	}, [ tabIndex ] );

	const { width } = Dimensions.get( 'window' );
	const tabKeys = useMemo( () => [ ...InserterTabs.TABS.keys() ], [] );
	const translateX = useMemo(
		() =>
			tabAnimation.interpolate( {
				inputRange: tabKeys,
				outputRange: tabKeys.map( ( key ) => key * -width ),
			} ),
		[ tabAnimation ]
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
			{ InserterTabs.TABS.map( ( tab, index ) => (
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

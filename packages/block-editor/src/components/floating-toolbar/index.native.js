/**
 * External dependencies
 */
import { Animated, Easing, View, Platform } from 'react-native';

/**
 * WordPress dependencies
 */
import { ToolbarButton, ToolbarGroup } from '@wordpress/components';
import { useEffect, useState, useRef } from '@wordpress/element';
import { withSelect, withDispatch } from '@wordpress/data';
import { compose } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import styles from './styles.scss';
import NavigateUpSVG from './nav-up-icon';
import BlockSelectionButton from '../block-list/block-selection-button.native';
import { store as blockEditorStore } from '../../store';

const EASE_IN_DURATION = 250;
const EASE_OUT_DURATION = 80;
const TRANSLATION_RANGE = 8;

const FloatingToolbar = ( {
	selectedClientId,
	parentId,
	showFloatingToolbar,
	onNavigateUp,
	isRTL,
} ) => {
	const opacity = useRef( new Animated.Value( 0 ) ).current;
	// Sustain old selection for proper block selection button rendering when exit animation is ongoing.
	const [ previousSelection, setPreviousSelection ] = useState( {} );

	useEffect( () => {
		Animated.timing( opacity, {
			toValue: showFloatingToolbar ? 1 : 0,
			duration: showFloatingToolbar
				? EASE_IN_DURATION
				: EASE_OUT_DURATION,
			easing: Easing.ease,
			useNativeDriver: true,
		} ).start();
	}, [ showFloatingToolbar ] );

	useEffect( () => {
		if ( showFloatingToolbar )
			setPreviousSelection( { clientId: selectedClientId, parentId } );
	}, [ selectedClientId ] );

	const translationRange =
		( Platform.OS === 'android' ? -1 : 1 ) * TRANSLATION_RANGE;

	const translation = opacity.interpolate( {
		inputRange: [ 0, 1 ],
		outputRange: [ translationRange, 0 ],
	} );

	const animationStyle = {
		opacity,
		transform: [ { translateY: translation } ],
	};

	const {
		clientId: previousSelectedClientId,
		parentId: previousSelectedParentId,
	} = previousSelection;

	const showPrevious = previousSelectedClientId && ! showFloatingToolbar;
	const blockSelectionButtonClientId = showPrevious
		? previousSelectedClientId
		: selectedClientId;
	const showNavUpButton =
		!! parentId || ( showPrevious && !! previousSelectedParentId );

	return (
		!! opacity && (
			<Animated.View
				style={ [ styles.floatingToolbar, animationStyle ] }
				pointerEvents={ showFloatingToolbar ? 'auto' : 'none' }
			>
				{ showNavUpButton && (
					<ToolbarGroup passedStyle={ styles.toolbar }>
						<ToolbarButton
							title={ __( 'Navigate Up' ) }
							onClick={
								! showPrevious &&
								( () => onNavigateUp( parentId ) )
							}
							icon={ <NavigateUpSVG isRTL={ isRTL } /> }
						/>
						<View style={ styles.pipe } />
					</ToolbarGroup>
				) }
				<BlockSelectionButton
					clientId={ blockSelectionButtonClientId }
				/>
			</Animated.View>
		)
	);
};

export default compose( [
	withSelect( ( select ) => {
		const {
			getSelectedBlockClientId,
			getBlockHierarchyRootClientId,
			getBlockRootClientId,
			getBlockCount,
			getSettings,
		} = select( blockEditorStore );

		const selectedClientId = getSelectedBlockClientId();

		if ( ! selectedClientId ) return;

		const rootBlockId = getBlockHierarchyRootClientId( selectedClientId );

		return {
			selectedClientId,
			showFloatingToolbar: !! getBlockCount( rootBlockId ),
			parentId: getBlockRootClientId( selectedClientId ),
			isRTL: getSettings().isRTL,
		};
	} ),
	withDispatch( ( dispatch ) => {
		const { selectBlock } = dispatch( blockEditorStore );

		return {
			onNavigateUp( clientId, initialPosition ) {
				selectBlock( clientId, initialPosition );
			},
		};
	} ),
] )( FloatingToolbar );

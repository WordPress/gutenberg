/**
 * External dependencies
 */
import { View, Dimensions, Text } from 'react-native';
import Animated, {
	useSharedValue,
	withSpring,
	withTiming,
	useAnimatedStyle,
	useAnimatedGestureHandler,
	runOnJS,
	Easing,
} from 'react-native-reanimated';

/**
 * WordPress dependencies
 */
import { createContext, Component } from '@wordpress/element';
import { withSelect } from '@wordpress/data';
import { compose } from '@wordpress/compose';
import { ReadableContentView, alignmentHelpers } from '@wordpress/components';

/**
 * Internal dependencies
 */
import BlockListBlock from './block';
import BlockInsertionPoint from './insertion-point';
import styles from './block-list-item.native.scss';
import { store as blockEditorStore } from '../../store';

const stretchStyle = {
	flex: 1,
};

// TODO: This probably belongs in its own component / directory
// Maybe we can do something similar block-draggable for web
export const DragContext = createContext( { dragHandler: () => null } );

const animationConfig = {
	easing: Easing.inOut( Easing.ease ),
	duration: 250,
};

const getPosition = (
	clientId,
	initialHeight,
	positionList,
	currentY,
	startY
) => {
	'worklet';

	let newPosition = positionList[ clientId ].y - ( startY - initialHeight );
	const yCord = currentY - initialHeight;
	// console.log( clientId );
	// console.log( 'initialHeight', initialHeight );
	// console.log( 'yCord', yCord );
	// console.log( initialHeight );
	// console.log( positionList );
	const position = Object.keys( positionList ).find( ( currentKey ) => {
		const currentPosition = positionList[ currentKey ];
		return (
			yCord >= currentPosition.y &&
			yCord <= currentPosition.y + currentPosition.height
		);
	} );

	if ( position ) {
		newPosition = positionList[ position ].height;
	}

	return {
		y: Math.abs( newPosition ),
		id: position,
		addAfter: false,
		addBefore: false,
	};
};

function DragAndSnap( { clientId, positionList, children } ) {
	const translation = {
		x: useSharedValue( 0 ),
		startX: useSharedValue( 0 ),
		y: useSharedValue( 0 ),
		yIndicator: useSharedValue( 0 ),
	};
	const moveToClientId = useSharedValue( undefined );
	const isDragging = useSharedValue( false );
	const initialHeight = useSharedValue( 0 );

	const onDragEnd = ( toClientId ) => {
		if ( toClientId ) {
			// use moveBlocksToPosition
		}
	};

	const dragHandler = useAnimatedGestureHandler( {
		onStart: ( { absoluteX: x, absoluteY: y }, ctx ) => {
			initialHeight.value = positionList[ clientId ].height;
			ctx.startX = x;
			ctx.startY = y;
			isDragging.value = true;
			translation.startX.value = x;
			// console.log( `Start: (${ x }, ${ y })` );
		},
		// For the long press gesture, we don't get translation, so we have to
		// calculate it.
		onActive: ( { absoluteX: x, absoluteY: y }, ctx ) => {
			translation.x.value = x - ctx.startX;
			translation.y.value = y - ctx.startY;
			const newPosition = getPosition(
				clientId,
				initialHeight.value,
				positionList,
				y,
				ctx.startY
			);
			translation.yIndicator.value = newPosition.y;
			moveToClientId.value = newPosition.id;
			// console.log( `Active: (${ x }, ${ y })` );
			// console.log(
			// 	`Translation: (${ translation.x.value }, ${ translation.y.value })`
			// );
		},
		onEnd: ( _ ) => {
			// translation.x.value = withSpring( 0 );
			translation.x.value = withTiming( 0, animationConfig, () => {
				isDragging.value = false;
				runOnJS( onDragEnd )( moveToClientId.value );
			} );
			translation.y.value = withSpring( 0 );
			console.log( 'ended' );
		},
		// When a modal is opened (e.g tapping on the three dots)
		onFail: ( _ ) => {
			translation.x.value = withSpring( 0 );
			translation.y.value = withSpring( 0 );
			isDragging.value = false;
			console.log( 'onFail' );
		},
	} );

	const dragStyles = useAnimatedStyle( () => {
		const height = isDragging.value ? 10 : 'auto';
		return {
			height,
			overflow: 'visible',
			transform: [
				{
					translateY: translation.y.value,
				},
			],
		};
	} );

	const dragContentStyles = useAnimatedStyle( () => {
		const height = isDragging.value ? 0 : 'auto';
		return {
			height,
			overflow: 'hidden',
		};
	} );

	const dragTopStyles = useAnimatedStyle( () => {
		const opacity = withSpring( isDragging.value ? 1 : 0 );
		const height = withSpring( isDragging.value ? 3 : 0 );

		return {
			opacity,
			position: 'absolute',
			left: 16,
			right: 16,
			top: 0,
			zIndex: 1,
			backgroundColor: 'red',
			height,
			transform: [
				{
					translateY: translation.yIndicator.value,
				},
			],
		};
	} );

	const dragButtonStyles = useAnimatedStyle( () => {
		const opacity = withSpring( isDragging.value ? 1 : 0 );

		return {
			width: 100,
			height: 40,
			backgroundColor: '#efefef',
			borderRadius: 20,
			opacity,
			position: 'absolute',
			bottom: -( initialHeight.value - 20 ),
			justifyContent: 'center',
			alignItems: 'center',
			transform: [
				{
					translateX: translation.startX.value - 50,
				},
			],
		};
	} );

	return (
		<DragContext.Provider value={ { dragHandler } }>
			{ /* I'm not sure why a View was required here.. but I was getting errors
					 about unwrapped Text without it */ }
			<View>
				<Animated.View style={ dragTopStyles } />
				<Animated.View style={ dragStyles }>
					<Animated.View style={ dragButtonStyles }>
						<Text>Block name</Text>
					</Animated.View>
					<Animated.View style={ dragContentStyles }>
						{ children }
					</Animated.View>
				</Animated.View>
			</View>
		</DragContext.Provider>
	);
}

export class BlockListItem extends Component {
	getMarginHorizontal() {
		const {
			blockAlignment,
			marginHorizontal,
			parentBlockAlignment,
			hasParents,
			blockName,
			parentBlockName,
			parentWidth,
			blockWidth,
		} = this.props;
		const {
			isFullWidth,
			isWideWidth,
			isWider,
			isContainerRelated,
		} = alignmentHelpers;

		if ( isFullWidth( blockAlignment ) ) {
			if ( ! hasParents ) {
				return 0;
			}
			return marginHorizontal;
		}
		if ( isWideWidth( blockAlignment ) ) {
			return marginHorizontal;
		}

		const screenWidth = Math.floor( Dimensions.get( 'window' ).width );

		if (
			isFullWidth( parentBlockAlignment ) &&
			! isWider( blockWidth, 'medium' )
		) {
			if (
				isContainerRelated( blockName ) ||
				isWider( screenWidth, 'mobile' )
			) {
				return marginHorizontal;
			}
			return marginHorizontal * 2;
		}

		if (
			isContainerRelated( parentBlockName ) &&
			! isContainerRelated( blockName )
		) {
			const isScreenWidthEqual = parentWidth === screenWidth;
			if ( isScreenWidthEqual || isWider( screenWidth, 'mobile' ) ) {
				return marginHorizontal * 2;
			}
		}

		return marginHorizontal;
	}

	getContentStyles( readableContentViewStyle ) {
		const {
			blockAlignment,
			blockName,
			hasParents,
			parentBlockName,
		} = this.props;
		const { isFullWidth, isContainerRelated } = alignmentHelpers;

		return [
			readableContentViewStyle,
			isFullWidth( blockAlignment ) &&
				! hasParents && {
					width: styles.fullAlignment.width,
				},
			! blockAlignment &&
				hasParents &&
				! isContainerRelated( parentBlockName ) &&
				isContainerRelated( blockName ) && {
					paddingHorizontal: styles.fullAlignmentPadding.paddingLeft,
				},
		];
	}

	render() {
		const {
			blockAlignment,
			clientId,
			isReadOnly,
			shouldShowInsertionPointBefore,
			shouldShowInsertionPointAfter,
			contentResizeMode,
			shouldShowInnerBlockAppender,
			parentWidth,
			marginHorizontal,
			blockName,
			blockWidth,
			positionList,
			onSetItemPosition,
			...restProps
		} = this.props;
		const readableContentViewStyle =
			contentResizeMode === 'stretch' && stretchStyle;
		const { isContainerRelated } = alignmentHelpers;

		if ( ! blockWidth ) {
			return null;
		}

		return (
			<View
				onLayout={ ( { nativeEvent } ) => {
					const { y, height } = nativeEvent.layout;
					onSetItemPosition( clientId, {
						y: Math.round( y ),
						height: Math.round( height ),
					} );
				} }
			>
				<ReadableContentView
					align={ blockAlignment }
					style={ [
						readableContentViewStyle,
						isContainerRelated( blockName ) &&
							parentWidth && {
								maxWidth: parentWidth + 2 * marginHorizontal,
							},
					] }
				>
					<View
						style={ this.getContentStyles(
							readableContentViewStyle
						) }
						pointerEvents={ isReadOnly ? 'box-only' : 'auto' }
					>
						{ shouldShowInsertionPointBefore && (
							<BlockInsertionPoint />
						) }
						<DragAndSnap
							clientId={ clientId }
							positionList={ positionList }
						>
							<BlockListBlock
								key={ clientId }
								showTitle={ false }
								clientId={ clientId }
								parentWidth={ parentWidth }
								{ ...restProps }
								marginHorizontal={ this.getMarginHorizontal() }
								blockWidth={ blockWidth }
							/>
						</DragAndSnap>
						{ ! shouldShowInnerBlockAppender() &&
							shouldShowInsertionPointAfter && (
								<BlockInsertionPoint />
							) }
					</View>
				</ReadableContentView>
			</View>
		);
	}
}

export default compose( [
	withSelect(
		( select, { rootClientId, isStackedHorizontally, clientId } ) => {
			const {
				getBlockOrder,
				getBlockInsertionPoint,
				isBlockInsertionPointVisible,
				getSettings,
				getBlockParents,
				__unstableGetBlockWithoutInnerBlocks,
				moveBlockToPosition,
				getBlockRootClientId,
			} = select( blockEditorStore );

			const blockClientIds = getBlockOrder( rootClientId );
			const insertionPoint = getBlockInsertionPoint();
			const blockInsertionPointIsVisible = isBlockInsertionPointVisible();
			const shouldShowInsertionPointBefore =
				! isStackedHorizontally &&
				blockInsertionPointIsVisible &&
				insertionPoint.rootClientId === rootClientId &&
				// if list is empty, show the insertion point (via the default appender)
				( blockClientIds.length === 0 ||
					// or if the insertion point is right before the denoted block
					blockClientIds[ insertionPoint.index ] === clientId );

			const shouldShowInsertionPointAfter =
				! isStackedHorizontally &&
				blockInsertionPointIsVisible &&
				insertionPoint.rootClientId === rootClientId &&
				// if the insertion point is at the end of the list
				blockClientIds.length === insertionPoint.index &&
				// and the denoted block is the last one on the list, show the indicator at the end of the block
				blockClientIds[ insertionPoint.index - 1 ] === clientId;

			const isReadOnly = getSettings().readOnly;

			const block = __unstableGetBlockWithoutInnerBlocks( clientId );
			const { attributes, name } = block || {};
			const { align } = attributes || {};
			const parents = getBlockParents( clientId, true );
			const hasParents = !! parents.length;
			const parentBlock = hasParents
				? __unstableGetBlockWithoutInnerBlocks( parents[ 0 ] )
				: {};
			const { align: parentBlockAlignment } =
				parentBlock?.attributes || {};
			const { name: parentBlockName } = parentBlock || {};

			return {
				shouldShowInsertionPointBefore,
				shouldShowInsertionPointAfter,
				isReadOnly,
				hasParents,
				blockAlignment: align,
				parentBlockAlignment,
				blockName: name,
				parentBlockName,
				moveBlockToPosition,
				getBlockRootClientId,
				rootClientId,
			};
		}
	),
] )( BlockListItem );

/**
 * External dependencies
 */
import { View, Dimensions } from 'react-native';
import SafeArea from 'react-native-safe-area';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { withSelect } from '@wordpress/data';
import { compose } from '@wordpress/compose';
import { ReadableContentView } from '@wordpress/components';

/**
 * Internal dependencies
 */
import BlockListBlock from './block';
import BlockInsertionPoint from './insertion-point';
import styles from './block-list-item.native.scss';

const BREAKPOINTS = {
	wide: 1020,
	small: 600,
};

const ALIGNMENTS = [ 'wide', 'full' ];

export class BlockListItem extends Component {
	constructor( props ) {
		super( props );
		const { blockAlignment } = props;

		this.onWidthChange = this.onWidthChange.bind( this );
		this.state = {
			width: Dimensions.get( 'window' ).width,
		};

		if ( ALIGNMENTS.includes( blockAlignment ) ) {
			Dimensions.addEventListener( 'change', this.onWidthChange );
		}
	}

	componentWillUnmount() {
		const { blockAlignment } = this.props;

		if ( ALIGNMENTS.includes( blockAlignment ) ) {
			Dimensions.removeEventListener( 'change', this.onWidthChange );
		}
	}

	onWidthChange() {
		SafeArea.getSafeAreaInsetsForRootView().then( ( insets ) => {
			const { left, right } = insets.safeAreaInsets;
			this.setState( {
				width: Dimensions.get( 'window' ).width - ( left + right ),
			} );
		} );
	}

	getMarginHorizontal() {
		const { blockAlignment, marginHorizontal } = this.props;
		const { width } = this.state;

		switch ( blockAlignment ) {
			case 'full':
				return styles.fullAlignment.marginLeft;
			case 'wide':
				return width > BREAKPOINTS.small && width < BREAKPOINTS.wide
					? styles.wideAlignmentCanvas.marginLeft
					: styles.wideAlignment.marginLeft;
			default:
				return marginHorizontal;
		}
	}

	getContentStyles( readableContentViewStyle ) {
		const { blockAlignment, hasParents } = this.props;
		const { width } = this.state;
		const isFullWidth = blockAlignment === 'full';

		return [
			readableContentViewStyle,
			isFullWidth &&
				! hasParents && {
					width,
				},
			isFullWidth &&
				hasParents && {
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
			...restProps
		} = this.props;
		const readableContentViewStyle =
			contentResizeMode === 'stretch' && styles.stretch;

		return (
			<ReadableContentView
				align={ blockAlignment }
				style={ readableContentViewStyle }
			>
				<View
					style={ this.getContentStyles( readableContentViewStyle ) }
					pointerEvents={ isReadOnly ? 'box-only' : 'auto' }
				>
					{ shouldShowInsertionPointBefore && (
						<BlockInsertionPoint />
					) }
					<BlockListBlock
						key={ clientId }
						showTitle={ false }
						clientId={ clientId }
						{ ...restProps }
						marginHorizontal={ this.getMarginHorizontal() }
					/>
					{ ! shouldShowInnerBlockAppender() &&
						shouldShowInsertionPointAfter && (
							<BlockInsertionPoint />
						) }
				</View>
			</ReadableContentView>
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
			} = select( 'core/block-editor' );

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
			const { attributes } = block || {};
			const { align } = attributes || {};
			const parents = getBlockParents( clientId, true );
			const hasParents = !! parents.length;

			return {
				shouldShowInsertionPointBefore,
				shouldShowInsertionPointAfter,
				isReadOnly,
				hasParents,
				blockAlignment: align,
			};
		}
	),
] )( BlockListItem );

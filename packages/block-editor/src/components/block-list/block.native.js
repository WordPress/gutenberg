/**
 * External dependencies
 */
import {
	View,
	Text,
	TouchableWithoutFeedback,
} from 'react-native';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { ToolbarButton, Toolbar } from '@wordpress/components';
import { withDispatch, withSelect } from '@wordpress/data';
import { compose, withPreferredColorScheme } from '@wordpress/compose';
import {
	getBlockType,
	getUnregisteredTypeHandlerName,
	__experimentalGetAccessibleBlockLabel as getAccessibleBlockLabel,
} from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import styles from './block.scss';
import BlockEdit from '../block-edit';
import BlockInvalidWarning from './block-invalid-warning';
import BlockMobileToolbar from '../block-mobile-toolbar';
import FloatingToolbar from './block-mobile-floating-toolbar';
import Breadcrumbs from './breadcrumb';
import NavigateUpSVG from './nav-up-icon';

class BlockListBlock extends Component {
	constructor() {
		super( ...arguments );

		this.insertBlocksAfter = this.insertBlocksAfter.bind( this );
		this.onFocus = this.onFocus.bind( this );
	}

	onFocus() {
		const { firstToSelectId, isSelected, onSelect } = this.props;
		if ( ! isSelected ) {
			onSelect( firstToSelectId );
		}
	}

	insertBlocksAfter( blocks ) {
		this.props.onInsertBlocks( blocks, this.props.order + 1 );

		if ( blocks[ 0 ] ) {
			// focus on the first block inserted
			this.props.onSelect( blocks[ 0 ].clientId );
		}
	}

	getBlockForType() {
		return (
			<BlockEdit
				name={ this.props.name }
				isSelected={ this.props.isSelected }
				attributes={ this.props.attributes }
				setAttributes={ this.props.onChange }
				onFocus={ this.onFocus }
				onReplace={ this.props.onReplace }
				insertBlocksAfter={ this.insertBlocksAfter }
				mergeBlocks={ this.props.mergeBlocks }
				onCaretVerticalPositionChange={ this.props.onCaretVerticalPositionChange }
				clientId={ this.props.clientId }
			/>
		);
	}

	renderBlockTitle() {
		return (
			<View style={ styles.blockTitle }>
				<Text>BlockType: { this.props.name }</Text>
			</View>
		);
	}

	applySelectedBlockStyle() {
		const {
			hasChildren,
			getStylesFromColorScheme,
			isSmallScreen,
			isRootListInnerBlockHolder,
		} = this.props;

		const fullSolidBorderStyle = { // define style for full border
			...styles.fullSolidBordered,
			...getStylesFromColorScheme( styles.solidBorderColor, styles.solidBorderColorDark ),
		};

		if ( hasChildren ) { // if block has children apply style for selected parent
			return { ...styles.selectedParent,	...fullSolidBorderStyle	};
		}

		// apply semi border selected style when screen is in vertical position
		// and selected block does not have InnerBlock inside
		if ( isSmallScreen && ! isRootListInnerBlockHolder ) {
			return {
				...styles.selectedRootLeaf,
				...styles.semiSolidBordered,
				...{ borderColor: fullSolidBorderStyle.borderColor },
			};
		}

		/* selected block is one of below:
				1. does not have children
				2. is not on root list level
				3. is an emty group block on root or nested level	*/
		return { ...styles.selectedLeaf, ...fullSolidBorderStyle };
	}

	applyUnSelectedBlockStyle() {
		const {
			hasChildren,
			isParentSelected,
			isAncestorSelected,
			hasParent,
			getStylesFromColorScheme,
		} = this.props;

		// if block does not have parent apply neutral or full
		// margins depending if block has children or not
		if ( ! hasParent ) {
			return hasChildren ? styles.neutral : styles.full;
		}

		if ( isParentSelected ) { // parent of a block is selected
			const dashedBorderStyle = { // define style for dashed border
				...styles.dashedBordered,
				...getStylesFromColorScheme( styles.dashedBorderColor, styles.dashedBorderColorDark ),
			};

			// return apply childOfSelected or childOfSelectedLeaf
			// margins depending if block has children or not
			return hasChildren ?
				{ ...styles.childOfSelected, ...dashedBorderStyle } :
				{ ...styles.childOfSelectedLeaf, ...dashedBorderStyle };
		}

		if ( isAncestorSelected ) { // ancestor of a block is selected
			return {
				...styles.descendantOfSelectedLeaf,
				...( hasChildren && styles.marginHorizontalNone ),
			};
		}

		// if none of above condition are met return apply neutral or full
		// margins depending if block has children or not
		return hasChildren ? styles.neutral : styles.full;
	}

	applyBlockStyle() {
		const {
			isSelected,
			isDimmed,
		} = this.props;

		return [
			isSelected ? this.applySelectedBlockStyle() : this.applyUnSelectedBlockStyle(),
			isDimmed && styles.dimmed,
		];
	}

	applyToolbarStyle() {
		const {
			hasChildren,
			isUnregisteredBlock,
		} = this.props;

		if ( ! hasChildren || isUnregisteredBlock ) {
			return styles.neutralToolbar;
		}
	}

	render() {
		const {
			attributes,
			blockType,
			clientId,
			icon,
			isSelected,
			isValid,
			order,
			title,
			showFloatingToolbar,
			parentId,
			isTouchable,
		} = this.props;

		const accessibilityLabel = getAccessibleBlockLabel( blockType, attributes, order + 1 );

		return (
			<>
				{ showFloatingToolbar &&
					( <FloatingToolbar>
						<Toolbar passedStyle={ styles.toolbar }>
							<ToolbarButton
								title={ __( 'Navigate Up' ) }
								onClick={ () => this.props.onSelect( parentId ) }
								icon={ NavigateUpSVG }
							/>
							<View style={ styles.pipe } />
						</Toolbar>
						<Breadcrumbs clientId={ clientId } />
					</FloatingToolbar>
					) }
				<TouchableWithoutFeedback
					onPress={ this.onFocus }
					accessible={ ! isSelected }
					accessibilityRole={ 'button' }
				>
					<View
						pointerEvents={ isTouchable ? 'auto' : 'box-only' }
						accessibilityLabel={ accessibilityLabel }
						style={ this.applyBlockStyle() }
					>
						{ isValid ? this.getBlockForType() : <BlockInvalidWarning blockTitle={ title } icon={ icon } /> }
						<View style={ this.applyToolbarStyle() } >{ isSelected && <BlockMobileToolbar clientId={ clientId } /> }</View>
					</View>
				</TouchableWithoutFeedback>
			</>
		);
	}
}

export default compose( [
	withSelect( ( select, { clientId, rootClientId } ) => {
		const {
			getBlockIndex,
			getBlocks,
			isBlockSelected,
			__unstableGetBlockWithoutInnerBlocks,
			getBlockHierarchyRootClientId,
			getSelectedBlockClientId,
			getBlock,
			getBlockRootClientId,
			getLowestCommonAncestorWithSelectedBlock,
			getBlockParents,
			getBlockCount,
		} = select( 'core/block-editor' );

		const {
			getGroupingBlockName,
		} = select( 'core/blocks' );

		const order = getBlockIndex( clientId, rootClientId );
		const isSelected = isBlockSelected( clientId );
		const isLastBlock = order === getBlocks().length - 1;
		const block = __unstableGetBlockWithoutInnerBlocks( clientId );
		const { name, attributes, isValid } = block || {};

		const isUnregisteredBlock = name === getUnregisteredTypeHandlerName();
		const blockType = getBlockType( name || 'core/missing' );
		const title = blockType.title;
		const icon = blockType.icon;

		const parents = getBlockParents( clientId, true );
		const parentId = parents[ 0 ] || '';

		const rootBlockId = getBlockHierarchyRootClientId( clientId );
		const rootBlock = getBlock( rootBlockId );
		const hasRootInnerBlocks = rootBlock.innerBlocks.length !== 0;

		const showFloatingToolbar = isSelected && hasRootInnerBlocks;

		const selectedBlockClientId = getSelectedBlockClientId();

		const commonAncestor = getLowestCommonAncestorWithSelectedBlock( clientId );
		const commonAncestorIndex = parents.indexOf( commonAncestor ) - 1;
		const firstToSelectId = commonAncestor ? parents[ commonAncestorIndex ] : parents[ parents.length - 1 ];

		const hasChildren = ! isUnregisteredBlock && !! getBlockCount( clientId );
		const hasParent = !! parentId;
		const isParentSelected = selectedBlockClientId && selectedBlockClientId === parentId;
		const isAncestorSelected = selectedBlockClientId && parents.includes( selectedBlockClientId );
		const isSelectedBlockNested = !! getBlockRootClientId( selectedBlockClientId );

		const selectedParents = selectedBlockClientId ? getBlockParents( selectedBlockClientId ) : [];
		const isDescendantSelected = selectedParents.includes( clientId );
		const isDescendantOfParentSelected = selectedParents.includes( parentId );
		const isTouchable = isSelected || isDescendantOfParentSelected || isParentSelected || parentId === '';
		const isDimmed = ! isSelected && isSelectedBlockNested && ! isAncestorSelected && ! isDescendantSelected && ( isDescendantOfParentSelected || rootBlockId === clientId );

		const isInnerBlockHolder = name === getGroupingBlockName();
		const isRootListInnerBlockHolder = ! isSelectedBlockNested && isInnerBlockHolder;

		return {
			icon,
			name: name || 'core/missing',
			order,
			title,
			attributes,
			blockType,
			isLastBlock,
			isSelected,
			isValid,
			showFloatingToolbar,
			parentId,
			isParentSelected,
			firstToSelectId,
			hasChildren,
			hasParent,
			isAncestorSelected,
			isTouchable,
			isDimmed,
			isRootListInnerBlockHolder,
			isUnregisteredBlock,
		};
	} ),
	withDispatch( ( dispatch, ownProps, { select } ) => {
		const {
			insertBlocks,
			mergeBlocks,
			replaceBlocks,
			selectBlock,
			updateBlockAttributes,
		} = dispatch( 'core/block-editor' );

		return {
			mergeBlocks( forward ) {
				const { clientId } = ownProps;
				const {
					getPreviousBlockClientId,
					getNextBlockClientId,
				} = select( 'core/block-editor' );

				if ( forward ) {
					const nextBlockClientId = getNextBlockClientId( clientId );
					if ( nextBlockClientId ) {
						mergeBlocks( clientId, nextBlockClientId );
					}
				} else {
					const previousBlockClientId = getPreviousBlockClientId( clientId );
					if ( previousBlockClientId ) {
						mergeBlocks( previousBlockClientId, clientId );
					}
				}
			},
			onInsertBlocks( blocks, index ) {
				insertBlocks( blocks, index, ownProps.rootClientId );
			},
			onSelect( clientId = ownProps.clientId, initialPosition ) {
				selectBlock( clientId, initialPosition );
			},
			onChange: ( attributes ) => {
				updateBlockAttributes( ownProps.clientId, attributes );
			},
			onReplace( blocks, indexToSelect ) {
				replaceBlocks( [ ownProps.clientId ], blocks, indexToSelect );
			},
		};
	} ),
	withPreferredColorScheme,
] )( BlockListBlock );

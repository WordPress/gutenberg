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
import { getBlockType } from '@wordpress/blocks';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import styles from './block.scss';
import BlockEdit from '../block-edit';
import BlockInvalidWarning from './block-invalid-warning';
import BlockMobileToolbar from './block-mobile-toolbar';
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

	getAccessibilityLabel() {
		const { attributes, name, order, title, getAccessibilityLabelExtra } = this.props;

		let blockName = '';

		if ( name === 'core/missing' ) { // is the block unrecognized?
			blockName = title;
		} else {
			blockName = sprintf(
				/* translators: accessibility text. %s: block name. */
				__( '%s Block' ),
				title, //already localized
			);
		}

		blockName += '. ' + sprintf( __( 'Row %d.' ), order + 1 );

		if ( getAccessibilityLabelExtra ) {
			const blockAccessibilityLabel = getAccessibilityLabelExtra( attributes );
			blockName += blockAccessibilityLabel ? ' ' + blockAccessibilityLabel : '';
		}

		return blockName;
	}

	applySelectedBlockStyle() {
		const {
			hasChildren,
			getStylesFromColorScheme,
			isSmallScreen,
			selectionIsNested,
		} = this.props;

		const fullSolidBorderStyle = {
			...styles.fullSolidBordered,
			...getStylesFromColorScheme( styles.solidBorderColor, styles.solidBorderColorDark ),
		};

		if ( hasChildren ) {
			return { ...styles.selectedParent,	...fullSolidBorderStyle	};
		}

		if ( isSmallScreen && ! selectionIsNested ) {
			return {
				...styles.selectedRootLeaf,
				...styles.semiSolidBordered,
				...{ borderColor: fullSolidBorderStyle.borderColor },
			};
		}

		return { ...styles.selectedLeaf,	...fullSolidBorderStyle	};
	}

	applyUnSelectedBlockStyle() {
		const {
			hasChildren,
			isParentSelected,
			isAncestorSelected,
			hasParent,
			getStylesFromColorScheme,
		} = this.props;

		if ( ! hasParent ) {
			return hasChildren ? styles.neutral : styles.full;
		}

		if ( isParentSelected ) {
			const dashedBorderStyle = {
				...styles.dashedBordered,
				...getStylesFromColorScheme( styles.dashedBorderColor, styles.dashedBorderColorDark ),
			};

			return hasChildren ?
				{ ...styles.childOfSelected, ...dashedBorderStyle } :
				{ ...styles.childOfSelectedLeaf, ...dashedBorderStyle };
		}

		if ( isAncestorSelected ) {
			return styles.descendantOfSelectedLeaf;
		}

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

	render() {
		const {
			clientId,
			icon,
			isSelected,
			isValid,
			title,
			showFloatingToolbar,
			parentId,
			isTouchable,
		} = this.props;

		const accessibilityLabel = this.getAccessibilityLabel();

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
						{ isValid && this.getBlockForType() }
						{ ! isValid &&
							<BlockInvalidWarning blockTitle={ title } icon={ icon } />
						}
						{ isSelected && <BlockMobileToolbar clientId={ clientId } /> }
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
			getBlockHierarchyRootClientId,
			getSelectedBlockClientId,
			getBlock,
			getBlockRootClientId,
			getLowestCommonAncestorWithSelectedBlock,
			getBlockParents,
		} = select( 'core/block-editor' );
		const order = getBlockIndex( clientId, rootClientId );
		const isSelected = isBlockSelected( clientId );
		const isLastBlock = order === getBlocks().length - 1;
		const block = getBlock( clientId );
		const { name, attributes, isValid } = block || {};
		const blockType = getBlockType( name || 'core/missing' );
		const title = blockType.title;
		const icon = blockType.icon;
		const getAccessibilityLabelExtra = blockType.__experimentalGetAccessibilityLabel;

		const parents = getBlockParents( clientId, true );
		const parentId = parents[ 0 ] || '';

		const rootBlockId = getBlockHierarchyRootClientId( clientId );
		const rootBlock = getBlock( rootBlockId );
		const hasRootInnerBlocks = rootBlock.innerBlocks.length !== 0;

		const showFloatingToolbar = isSelected && hasRootInnerBlocks;

		const selectedBlockClientId = getSelectedBlockClientId();

		const commonAncestor = getLowestCommonAncestorWithSelectedBlock( clientId );
		const clientTree = [ clientId, ...parents ];
		const commonAncestorIndex = clientTree.indexOf( commonAncestor ) - 1;
		const firstToSelectId = commonAncestor || selectedBlockClientId ? clientTree[ commonAncestorIndex ] : rootBlockId;

		const hasChildren = block.innerBlocks.length !== 0;
		const hasParent = !! parents[ 0 ];
		const isParentSelected = selectedBlockClientId && selectedBlockClientId === parents[ 0 ];
		const isAncestorSelected = selectedBlockClientId && parents.includes( selectedBlockClientId );
		const selectionIsNested = !! getBlockRootClientId( selectedBlockClientId );
		const isDimmed = ! isSelected && ! isAncestorSelected && firstToSelectId === clientId && selectionIsNested;

		const isDescendantSelected = selectedBlockClientId && getBlockParents( selectedBlockClientId ).includes( clientId );
		const isTouchable = isSelected || isDescendantSelected || selectedBlockClientId === parentId || parentId === '';

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
			getAccessibilityLabelExtra,
			showFloatingToolbar,
			parentId,
			isParentSelected,
			firstToSelectId,
			hasChildren,
			hasParent,
			isAncestorSelected,
			isTouchable,
			isDimmed,
			selectionIsNested,
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

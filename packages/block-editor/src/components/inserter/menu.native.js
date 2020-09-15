/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { TouchableHighlight } from 'react-native';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { createBlock, store as blocksStore } from '@wordpress/blocks';
import { withDispatch, withSelect } from '@wordpress/data';
import { withInstanceId, compose } from '@wordpress/compose';
import {
	BottomSheet,
	BottomSheetConsumer,
	SegmentedControl,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import BlocksTab from './blocks-tab';
import ReusableBlocksTab from './reusable-blocks-tab';
import styles from './style.scss';

const TABS = [ __( 'Blocks' ), __( 'Reusable' ) ];
const REUSABLE_BLOCKS_CATEGORY = 'reusable';

export class InserterMenu extends Component {
	constructor() {
		super( ...arguments );

		this.onClose = this.onClose.bind( this );
		this.onChangeTab = this.onChangeTab.bind( this );
		this.renderTabs = this.renderTabs.bind( this );
		this.state = {
			tab: 0,
		};
	}

	componentDidMount() {
		this.props.showInsertionPoint();
	}

	componentWillUnmount() {
		this.props.hideInsertionPoint();
	}

	onClose() {
		// if should replace but didn't insert any block
		// re-insert default block
		if ( this.props.shouldReplaceBlock ) {
			this.props.insertDefaultBlock();
		}
		this.props.onDismiss();
	}

	onChangeTab( tab ) {
		this.setState( { tab: TABS.indexOf( tab ) } );
	}

	renderTabs( { listProps } ) {
		const { onSelect, destinationRootClientId } = this.props;
		const { tab } = this.state;

		const tabProps = {
			rootClientId: destinationRootClientId,
			onSelect,
			listProps,
		};

		switch ( tab ) {
			case 0:
				return <BlocksTab { ...tabProps } />;
			case 1:
				return <ReusableBlocksTab { ...tabProps } />;
		}
	}

	render() {
		const { hasReusableBlocks } = this.props;

		const hideHeader = ! hasReusableBlocks;

		return (
			<BottomSheet
				isVisible={ true }
				onClose={ this.onClose }
				header={
					<SegmentedControl
						segments={ TABS }
						segmentHandler={ this.onChangeTab }
					/>
				}
				hideHeader={ hideHeader }
				hasNavigation
				contentStyle={ styles.list }
				isChildrenScrollable
			>
				<TouchableHighlight accessible={ false }>
					<BottomSheetConsumer>
						{ this.renderTabs }
					</BottomSheetConsumer>
				</TouchableHighlight>
			</BottomSheet>
		);
	}
}

export default compose(
	withSelect( ( select, { clientId, isAppender, rootClientId } ) => {
		const {
			getInserterItems,
			getBlockName,
			getBlockRootClientId,
			getBlockSelectionEnd,
			getSettings,
		} = select( 'core/block-editor' );
		const { getChildBlockNames } = select( blocksStore );

		let destinationRootClientId = rootClientId;
		if ( ! destinationRootClientId && ! clientId && ! isAppender ) {
			const end = getBlockSelectionEnd();
			if ( end ) {
				destinationRootClientId =
					getBlockRootClientId( end ) || undefined;
			}
		}
		const destinationRootBlockName = getBlockName(
			destinationRootClientId
		);

		const {
			__experimentalShouldInsertAtTheTop: shouldInsertAtTheTop,
		} = getSettings();

		const items = getInserterItems( destinationRootClientId );
		const reusableBlockItems = items.filter(
			( { category } ) => category === REUSABLE_BLOCKS_CATEGORY
		);

		return {
			rootChildBlocks: getChildBlockNames( destinationRootBlockName ),
			items,
			hasReusableBlocks: !! reusableBlockItems.length,
			destinationRootClientId,
			shouldInsertAtTheTop,
		};
	} ),
	withDispatch( ( dispatch, ownProps, { select } ) => {
		const {
			showInsertionPoint,
			hideInsertionPoint,
			removeBlock,
			resetBlocks,
			clearSelectedBlock,
			insertBlock,
			insertDefaultBlock,
		} = dispatch( 'core/block-editor' );

		return {
			showInsertionPoint() {
				if ( ownProps.shouldReplaceBlock ) {
					const { getBlockOrder, getBlockCount } = select(
						'core/block-editor'
					);

					const count = getBlockCount();
					// Check if there is a rootClientId because that means it is a nested replacable block and we don't want to clear/reset all blocks.
					if ( count === 1 && ! ownProps.rootClientId ) {
						// removing the last block is not possible with `removeBlock` action
						// it always inserts a default block if the last of the blocks have been removed
						clearSelectedBlock();
						resetBlocks( [] );
					} else {
						const blockToReplace = getBlockOrder(
							ownProps.destinationRootClientId
						)[ ownProps.insertionIndex ];

						removeBlock( blockToReplace, false );
					}
				}
				showInsertionPoint(
					ownProps.destinationRootClientId,
					ownProps.insertionIndex
				);
			},
			hideInsertionPoint,
			onSelect( item ) {
				const { name, initialAttributes, innerBlocks } = item;

				const insertedBlock = createBlock(
					name,
					initialAttributes,
					innerBlocks
				);

				insertBlock(
					insertedBlock,
					ownProps.insertionIndex,
					ownProps.destinationRootClientId
				);

				ownProps.onSelect();
			},
			insertDefaultBlock() {
				insertDefaultBlock(
					{},
					ownProps.destinationRootClientId,
					ownProps.insertionIndex
				);
			},
		};
	} ),
	withInstanceId
)( InserterMenu );

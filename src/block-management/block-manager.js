/**
 * @format
 * @flow
 */

import React from 'react';
import { xorBy, isEqual } from 'lodash';

import { Platform, Switch, Text, View, FlatList, KeyboardAvoidingView } from 'react-native';
import { DataSource } from 'react-native-recyclerview-list';
import BlockHolder from './block-holder';
import { InlineToolbarButton } from './constants';
import type { BlockType } from '../store/types';
import styles from './block-manager.scss';
import BlockPicker from './block-picker';
import HTMLTextInput from '../components/html-text-input';
import BlockToolbar from './block-toolbar';

// Gutenberg imports
import { createBlock } from '@wordpress/blocks';

export type BlockListType = {
	onChange: ( clientId: string, attributes: mixed ) => void,
	focusBlockAction: string => mixed,
	moveBlockUpAction: string => mixed,
	moveBlockDownAction: string => mixed,
	deleteBlockAction: string => mixed,
	createBlockAction: ( string, BlockType ) => mixed,
	parseBlocksAction: string => mixed,
	serializeToNativeAction: void => void,
	mergeBlocksAction: ( string, string ) => mixed,
	blocks: Array<BlockType>,
	isBlockSelected: string => boolean,
};

type PropsType = BlockListType;
type StateType = {
	dataSource: DataSource,
	showHtml: boolean,
	inspectBlocks: boolean,
	blockTypePickerVisible: boolean,
	blocks: Array<BlockType>,
	selectedBlockType: string,
	refresh: boolean,
};

export default class BlockManager extends React.Component<PropsType, StateType> {
	// a scrolling function for when on Android (when the dataSource is up-to-date to perform the scroll)
	scrollTo: number => void;

	constructor( props: PropsType ) {
		super( props );

		const blocks = props.blocks.map( ( block ) => {
			const newBlock = { ...block };
			newBlock.focused = props.isBlockSelected( block.clientId );
			return newBlock;
		} );

		this.state = {
			blocks: blocks,
			dataSource: new DataSource( blocks, ( item: BlockType ) => item.clientId ),
			showHtml: false,
			inspectBlocks: false,
			blockTypePickerVisible: false,
			selectedBlockType: 'core/paragraph', // just any valid type to start from
			refresh: false,
		};
	}

	onBlockHolderPressed( clientId: string ) {
		this.props.focusBlockAction( clientId );
	}

	static focusDataSourceItem( dataSource: DataSource, clientId: string ) {
		for ( let i = 0; i < dataSource.size(); ++i ) {
			const block = dataSource.get( i );
			if ( block.clientId === clientId ) {
				block.focused = true;
			} else {
				block.focused = false;
			}
		}
	}

	getDataSourceIndexFromClientId( clientId: string ) {
		for ( let i = 0; i < this.state.dataSource.size(); ++i ) {
			const block = this.state.dataSource.get( i );
			if ( block.clientId === clientId ) {
				return i;
			}
		}
		return -1;
	}

	findDataSourceIndexForFocusedItem() {
		for ( let i = 0; i < this.state.dataSource.size(); ++i ) {
			const block = this.state.dataSource.get( i );
			if ( block.focused === true ) {
				return i;
			}
		}
		return -1;
	}

	// TODO: in the near future this will likely be changed to onShowBlockTypePicker and bound to this.props
	// once we move the action to the toolbar
	showBlockTypePicker( show: boolean ) {
		this.setState( { ...this.state, blockTypePickerVisible: show } );
	}

	onBlockTypeSelected( itemValue: string ) {
		this.setState( { ...this.state, selectedBlockType: itemValue, blockTypePickerVisible: false } );

		// find currently focused block. It can be '-1' if no block is currently selected or there are no blocks at all.
		let focusedItemIndex = this.findDataSourceIndexForFocusedItem();
		if ( focusedItemIndex === -1 ) {
			focusedItemIndex = this.state.dataSource.size() - 1;
		}

		// create an empty block of the selected type
		const newBlock = createBlock( itemValue, { content: 'new test text for a ' + itemValue + ' block' } );

		// set it into the datasource, and use the same object instance to send it to props/redux
		this.state.dataSource.splice( focusedItemIndex + 1, 0, newBlock );

		if ( this.scrollTo ) {
			this.scrollTo( focusedItemIndex + 1 );
		}

		this.props.createBlockAction( newBlock.clientId, newBlock );

		// now set the focus
		this.props.focusBlockAction( newBlock.clientId );
	}

	static getDerivedStateFromProps( props: PropsType, state: StateType ) {
		const blocks = props.blocks.map( ( block ) => {
			const newBlock = { ...block };
			newBlock.focused = props.isBlockSelected( block.clientId );
			return newBlock;
		} );

		// if the blocks in the list (not the order or the block attribute)
		// have changed without our knowledge, recreate the dataSource
		if ( xorBy( state.blocks, blocks, 'clientId' ).length !== 0 ) {
			return {
				dataSource: new DataSource( blocks, ( item: BlockType ) => item.clientId ),
				blocks,
				refresh: ! state.refresh,
			};
		}

		// if some properties of the blocks have changed, assume it's `focused` and manually update in dataSource
		if ( ! isEqual( state.blocks, blocks ) ) {
			const blockFocused = blocks.find( ( block ) => block.focused );
			if ( blockFocused ) {
				BlockManager.focusDataSourceItem( state.dataSource, blockFocused.clientId );
			}
			return {
				...state,
				blocks,
				refresh: ! state.refresh,
			};
		}

		// no state change necessary
		return null;
	}

	onInlineToolbarButtonPressed( button: number, clientId: string ) {
		const dataSourceBlockIndex = this.getDataSourceIndexFromClientId( clientId );
		switch ( button ) {
			case InlineToolbarButton.UP:
				this.state.dataSource.moveUp( dataSourceBlockIndex );
				this.props.moveBlockUpAction( clientId );
				break;
			case InlineToolbarButton.DOWN:
				this.state.dataSource.moveDown( dataSourceBlockIndex );
				this.props.moveBlockDownAction( clientId );
				break;
			case InlineToolbarButton.DELETE:
				this.state.dataSource.splice( dataSourceBlockIndex, 1 );
				this.props.deleteBlockAction( clientId );
				break;
			case InlineToolbarButton.SETTINGS:
				// TODO: implement settings
				break;
		}
	}

	componentDidUpdate() {
		// List has been updated, tell the recycler view to update the view
		this.state.dataSource.setDirty();
	}

	insertBlocksAfter( clientId: string, blocks: Array<Object> ) {
		// find currently focused block
		const focusedItemIndex = this.getDataSourceIndexFromClientId( clientId );
		//TODO: make sure to insert all the passed blocks
		const newBlock = blocks[ 0 ];
		if ( ! newBlock ) {
			return;
		}

		// set it into the datasource, and use the same object instance to send it to props/redux
		this.state.dataSource.splice( focusedItemIndex + 1, 0, newBlock );
		this.props.createBlockAction( newBlock.clientId, newBlock );

		// now set the focus
		this.props.focusBlockAction( newBlock.clientId );
	}

	mergeBlocks = ( forward: boolean = false ) => {
		// find currently focused block
		const focusedItemIndex = this.state.blocks.findIndex( ( block ) => block.focused );
		if ( focusedItemIndex === -1 ) {
			// do nothing if it's not found.
			// Updates calls from the native side may arrive late, and the block already been deleted
			return;
		}

		const block = this.state.blocks[ focusedItemIndex ];
		const previousBlock = this.state.blocks[ focusedItemIndex - 1 ];
		const nextBlock = this.state.blocks[ focusedItemIndex + 1 ];

		// Do nothing when it's the first block.
		if (
			( ! forward && ! previousBlock ) ||
			( forward && ! nextBlock )
		) {
			return;
		}

		if ( forward ) {
			this.props.mergeBlocksAction( block.clientId, nextBlock.clientId );
		} else {
			this.props.mergeBlocksAction( previousBlock.clientId, block.clientId );
		}
	};

	onChange( clientId: string, attributes: mixed ) {
		// Update Redux store
		this.props.onChange( clientId, attributes );

		// Change the data source
		const index = this.getDataSourceIndexFromClientId( clientId );
		if ( index === -1 ) {
			// do nothing if it's not found.
			// Updates calls from the native side may arrive late, and the block already been deleted/merged
			return;
		}
		const dataSource = this.state.dataSource;
		const block = dataSource.get( index );
		block.attributes = attributes;
		dataSource.set( index, block );
	}

	onReplace( clientId: string, blocks: Array<Object> ) {
		// Insert the optional blocks and then remove the block indentified by clientId
		this.insertBlocksAfter( clientId, blocks );
		const dataSourceBlockIndex = this.getDataSourceIndexFromClientId( clientId );
		this.state.dataSource.splice( dataSourceBlockIndex, 1 );
		this.props.deleteBlockAction( clientId );
	}

	renderList() {
		const behavior = Platform.OS === 'ios' ? 'padding' : null;
		// TODO: we won't need this. This just a temporary solution until we implement the RecyclerViewList native code for iOS
		// And fix problems with RecyclerViewList on Android
		let list = (
			<FlatList
				style={ styles.list }
				data={ this.state.blocks }
				extraData={ { refresh: this.state.refresh, inspectBlocks: this.state.inspectBlocks } }
				keyExtractor={ ( item ) => item.clientId }
				renderItem={ this.renderItem.bind( this ) }
			/>
		);
		return (
			<KeyboardAvoidingView style={ { flex: 1 } } behavior={ behavior }>
				{ list }
				<BlockToolbar
					onInsertClick={ () => {
						this.showBlockTypePicker( true );
					} }
				/>
			</KeyboardAvoidingView>
		);
	}

	render() {
		const list = this.renderList();
		const blockTypePicker = (
			<BlockPicker
				onDismiss={ () => {
					this.showBlockTypePicker( false );
				} }
				onValueSelected={ ( itemValue ) => {
					this.onBlockTypeSelected( itemValue );
				} }
			/>
		);

		return (
			<View style={ styles.container }>
				<View style={ styles.switch }>
					<Switch
						activeText={ 'On' }
						inActiveText={ 'Off' }
						value={ this.state.showHtml }
						onValueChange={ this.handleSwitchEditor }
					/>
					<Text style={ styles.switchLabel }>View html output</Text>
					<Switch
						activeText={ 'On' }
						inActiveText={ 'Off' }
						value={ this.state.inspectBlocks }
						onValueChange={ this.handleInspectBlocksChanged }
					/>
					<Text style={ styles.switchLabel }>Inspect blocks</Text>
				</View>
				{ this.state.showHtml && this.renderHTML() }
				{ ! this.state.showHtml && list }
				{ this.state.blockTypePickerVisible && blockTypePicker }
			</View>
		);
	}

	handleSwitchEditor = ( showHtml: boolean ) => {
		this.setState( { showHtml } );
	}

	handleInspectBlocksChanged = ( inspectBlocks: boolean ) => {
		this.setState( { inspectBlocks } );
	}

	renderItem( value: { item: BlockType } ) {
		const insertHere = (
			<View style={ styles.containerStyleAddHere } >
				<View style={ styles.lineStyleAddHere }></View>
				<Text style={ styles.labelStyleAddHere } >ADD BLOCK HERE</Text>
				<View style={ styles.lineStyleAddHere }></View>
			</View>
		);

		return (
			<View>
				<BlockHolder
					key={ value.item.clientId }
					onInlineToolbarButtonPressed={ this.onInlineToolbarButtonPressed.bind( this ) }
					onBlockHolderPressed={ this.onBlockHolderPressed.bind( this ) }
					onChange={ this.onChange.bind( this ) }
					showTitle={ this.state.inspectBlocks }
					focused={ value.item.focused }
					clientId={ value.item.clientId }
					insertBlocksAfter={ ( blocks ) =>
						this.insertBlocksAfter.bind( this )( value.item.clientId, blocks )
					}
					mergeBlocks={ this.mergeBlocks }
					onReplace={ ( blocks ) =>
						this.onReplace( value.item.clientId, blocks )
					}
					{ ...value.item }
				/>
				{ this.state.blockTypePickerVisible && value.item.focused && insertHere }
			</View>
		);
	}

	renderHTML() {
		return (
			<HTMLTextInput { ...this.props } />
		);
	}
}

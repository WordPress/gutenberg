/**
 * @format
 * @flow
 */

import React from 'react';
import { isEqual } from 'lodash';

import { Platform, Switch, Text, View, FlatList, KeyboardAvoidingView } from 'react-native';
import RecyclerViewList, { DataSource } from 'react-native-recyclerview-list';
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
		if ( props.fullparse === true ) {
			return {
				...state,
				dataSource: new DataSource( props.blocks, ( item: BlockType ) => item.clientId ),
			};
		}

		const blocks = props.blocks.map( ( block ) => {
			const newBlock = { ...block };
			newBlock.focused = props.isBlockSelected( block.clientId );
			return newBlock;
		} );

		if ( ! isEqual( state.blocks, blocks ) ) {
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

		const newBlock = blocks[ 0 ];

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

	renderList() {
		let list;
		const behavior = Platform.OS === 'ios' ? 'padding' : null;
		if ( Platform.OS === 'android' ) {
			list = (
				<RecyclerViewList
					ref={ ( component: RecyclerViewList ) =>
						( this.scrollTo = ( index ) => component.scrollToIndex( { index: index, animated: true } ) )
					}
					style={ styles.list }
					dataSource={ this.state.dataSource }
					renderItem={ this.renderItem.bind( this ) }
					ListEmptyComponent={
						<View style={ { borderColor: '#e7e7e7', borderWidth: 10, margin: 10, padding: 20 } }>
							<Text style={ { fontSize: 15 } }>No blocks :(</Text>
						</View>
					}
				/>
			);
		} else {
			// TODO: we won't need this. This just a temporary solution until we implement the RecyclerViewList native code for iOS
			list = (
				<FlatList
					style={ styles.list }
					data={ this.state.blocks }
					extraData={ { refresh: this.state.refresh, inspectBlocks: this.state.inspectBlocks } }
					keyExtractor={ ( item ) => item.clientId }
					renderItem={ this.renderItem.bind( this ) }
				/>
			);
		}
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
				visible={ this.state.blockTypePickerVisible }
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
				{ blockTypePicker }
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

/**
 * @format
 * @flow
 */

import React from 'react';
import { isEqual } from 'lodash';

import { Switch, Text, View, FlatList, Keyboard, LayoutChangeEvent } from 'react-native';
import BlockHolder from './block-holder';
import { InlineToolbarButton } from './constants';
import type { BlockType } from '../store/types';
import styles from './block-manager.scss';
import BlockPicker from './block-picker';
import HTMLTextInput from '../components/html-text-input';
import BlockToolbar from './block-toolbar';
import KeyboardAvoidingView from '../components/keyboard-avoiding-view';

// Gutenberg imports
import { createBlock } from '@wordpress/blocks';
import EventEmitter from 'events';

const keyboardDidShow = 'keyboardDidShow';
const keyboardDidHide = 'keyboardDidHide';

export type BlockListType = {
	onChange: ( clientId: string, attributes: mixed ) => void,
	focusBlockAction: string => void,
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
	showHtml: boolean,
	inspectBlocks: boolean,
	blockTypePickerVisible: boolean,
	blocks: Array<BlockType>,
	selectedBlockType: string,
	refresh: boolean,
	isKeyboardVisible: boolean,
	rootViewHeight: number;
};

export default class BlockManager extends React.Component<PropsType, StateType> {
	keyboardDidShowListener: EventEmitter;
	keyboardDidHideListener: EventEmitter;

	constructor( props: PropsType ) {
		super( props );

		const blocks = props.blocks.map( ( block ) => {
			const newBlock = { ...block };
			newBlock.focused = props.isBlockSelected( block.clientId );
			return newBlock;
		} );

		this.state = {
			blocks: blocks,
			showHtml: false,
			inspectBlocks: false,
			blockTypePickerVisible: false,
			selectedBlockType: 'core/paragraph', // just any valid type to start from
			refresh: false,
			isKeyboardVisible: false,
			rootViewHeight: 0,
		};
	}

	// TODO: in the near future this will likely be changed to onShowBlockTypePicker and bound to this.props
	// once we move the action to the toolbar
	showBlockTypePicker( show: boolean ) {
		this.setState( { ...this.state, blockTypePickerVisible: show } );
	}

	onKeyboardHide() {
		Keyboard.dismiss();
	}

	onBlockTypeSelected( itemValue: string ) {
		this.setState( { ...this.state, selectedBlockType: itemValue, blockTypePickerVisible: false } );

		// create an empty block of the selected type
		const newBlock = createBlock( itemValue, { content: 'new test text for a ' + itemValue + ' block' } );

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

	onInlineToolbarButtonPressed = ( button: number, clientId: string ) => {
		switch ( button ) {
			case InlineToolbarButton.UP:
				this.props.moveBlockUpAction( clientId );
				break;
			case InlineToolbarButton.DOWN:
				this.props.moveBlockDownAction( clientId );
				break;
			case InlineToolbarButton.DELETE:
				this.props.deleteBlockAction( clientId );
				break;
			case InlineToolbarButton.SETTINGS:
				// TODO: implement settings
				break;
		}
	}

	onRootViewLayout = ( event: LayoutChangeEvent ) => {
		const { height } = event.nativeEvent.layout;
		this.setState( { rootViewHeight: height } );
	}

	componentDidMount() {
		this.keyboardDidShowListener = Keyboard.addListener( keyboardDidShow, this.keyboardDidShow );
		this.keyboardDidHideListener = Keyboard.addListener( keyboardDidHide, this.keyboardDidHide );
	}

	componentWillUnmount() {
		Keyboard.removeListener( keyboardDidShow, this.keyboardDidShow );
		Keyboard.removeListener( keyboardDidHide, this.keyboardDidHide );
	}

	keyboardDidShow = () => {
		this.setState( { isKeyboardVisible: true } );
	}

	keyboardDidHide = () => {
		this.setState( { isKeyboardVisible: false } );
	}

	insertBlocksAfter( clientId: string, blocks: Array<Object> ) {
		//TODO: make sure to insert all the passed blocks
		const newBlock = blocks[ 0 ];
		if ( ! newBlock ) {
			return;
		}

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

	onReplace( clientId: string, blocks: Array<Object> ) {
		// Insert the optional blocks and then remove the block indentified by clientId
		this.insertBlocksAfter( clientId, blocks );
		this.props.deleteBlockAction( clientId );
	}

	renderList() {
		// TODO: we won't need this. This just a temporary solution until we implement the RecyclerViewList native code for iOS
		// And fix problems with RecyclerViewList on Android
		const list = (
			<FlatList
				style={ styles.list }
				data={ this.state.blocks }
				extraData={ { refresh: this.state.refresh, inspectBlocks: this.state.inspectBlocks } }
				keyExtractor={ ( item ) => item.clientId }
				renderItem={ this.renderItem.bind( this ) }
			/>
		);
		return (
			<KeyboardAvoidingView style={ { flex: 1 } } parentHeight={ this.state.rootViewHeight }>
				{ list }
				<BlockToolbar
					onInsertClick={ () => {
						this.showBlockTypePicker( true );
					} }
					onKeyboardHide={ () => {
						this.onKeyboardHide();
					} }
					showKeyboardHideButton={ this.state.isKeyboardVisible }
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
			<View style={ styles.container } onLayout={ this.onRootViewLayout }>
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
	};

	handleInspectBlocksChanged = ( inspectBlocks: boolean ) => {
		this.setState( { inspectBlocks } );
	};

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
					onInlineToolbarButtonPressed={ this.onInlineToolbarButtonPressed }
					onBlockHolderPressed={ this.props.focusBlockAction }
					onChange={ this.props.onChange }
					showTitle={ this.state.inspectBlocks }
					focused={ value.item.focused }
					clientId={ value.item.clientId }
					insertBlocksAfter={ ( blocks ) => this.insertBlocksAfter( value.item.clientId, blocks ) }
					mergeBlocks={ this.mergeBlocks }
					onReplace={ ( blocks ) => this.onReplace( value.item.clientId, blocks ) }
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

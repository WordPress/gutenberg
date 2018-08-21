/**
 * @format
 * @flow
 */

import React from 'react';
import { Platform, Switch, Text, View, FlatList, TextInput, KeyboardAvoidingView } from 'react-native';
import RecyclerViewList, { DataSource } from 'react-native-recyclerview-list';
import BlockHolder from './block-holder';
import { ToolbarButton } from './constants';
import type { BlockType } from '../store/';
import styles from './block-manager.scss';
import BlockPicker from './block-picker';
// Gutenberg imports
import { getBlockType, serialize, createBlock } from '@wordpress/blocks';

export type BlockListType = {
	onChange: ( clientId: string, attributes: mixed ) => void,
	focusBlockAction: string => mixed,
	moveBlockUpAction: string => mixed,
	moveBlockDownAction: string => mixed,
	deleteBlockAction: string => mixed,
	createBlockAction: ( string, BlockType, string ) => mixed,
	parseBlocksAction: string => mixed,
	blocks: Array<BlockType>,
	aztechtml: string,
	refresh: boolean,
};

type PropsType = BlockListType;
type StateType = {
	dataSource: DataSource,
	showHtml: boolean,
	blockTypePickerVisible: boolean,
	selectedBlockType: string,
	html: string,
};

export default class BlockManager extends React.Component<PropsType, StateType> {
	constructor( props: PropsType ) {
		super( props );
		this.state = {
			dataSource: new DataSource( this.props.blocks, ( item: BlockType ) => item.clientId ),
			showHtml: false,
			blockTypePickerVisible: false,
			selectedBlockType: 'core/paragraph', // just any valid type to start from
			html: '',
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

		// find currently focused block
		const focusedItemIndex = this.findDataSourceIndexForFocusedItem();
		const clientIdFocused = this.state.dataSource.get( focusedItemIndex ).clientId;

		// create an empty block of the selected type
		const newBlock = createBlock( itemValue, { content: 'new test text for a ' + itemValue + ' block' } );
		newBlock.focused = false;

		// set it into the datasource, and use the same object instance to send it to props/redux
		this.state.dataSource.splice( focusedItemIndex + 1, 0, newBlock );
		this.props.createBlockAction( newBlock.clientId, newBlock, clientIdFocused );

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
		// no state change necessary
		return null;
	}

	onToolbarButtonPressed( button: number, clientId: string ) {
		const dataSourceBlockIndex = this.getDataSourceIndexFromClientId( clientId );
		switch ( button ) {
			case ToolbarButton.UP:
				this.state.dataSource.moveUp( dataSourceBlockIndex );
				this.props.moveBlockUpAction( clientId );
				break;
			case ToolbarButton.DOWN:
				this.state.dataSource.moveDown( dataSourceBlockIndex );
				this.props.moveBlockDownAction( clientId );
				break;
			case ToolbarButton.DELETE:
				this.state.dataSource.splice( dataSourceBlockIndex, 1 );
				this.props.deleteBlockAction( clientId );
				break;
			case ToolbarButton.PLUS:
				this.showBlockTypePicker( true );
				break;
			case ToolbarButton.SETTINGS:
				// TODO: implement settings
				break;
		}
	}

	serializeToHtml() {
		return this.props.blocks
			.map( ( block ) => {
				const blockType = getBlockType( block.name );
				if ( blockType ) {
					return serialize( [ block ] ) + '\n\n';
				} else if ( block.name === 'aztec' ) {
					return '<aztec>' + block.attributes.content + '</aztec>\n\n';
				}

				return '<span>' + block.attributes.content + '</span>\n\n';
			} )
			.reduce( ( prevVal, value ) => {
				return prevVal + value;
			}, '' );
	}

	parseHTML() {
		const { parseBlocksAction } = this.props;
		const { html } = this.state;
		parseBlocksAction( html );
	}

	componentDidUpdate() {
		// List has been updated, tell the recycler view to update the view
		this.state.dataSource.setDirty();
	}

	onChange( clientId: string, attributes: mixed ) {
		// Update datasource UI
		const index = this.getDataSourceIndexFromClientId( clientId );
		const dataSource = this.state.dataSource;
		const block = dataSource.get( index );
		block.attributes = attributes;
		dataSource.set( index, block );
		// Update Redux store
		this.props.onChange( clientId, attributes );
	}

	render() {
		let list;
		if ( Platform.OS === 'android' ) {
			list = (
				<RecyclerViewList
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
					data={ this.props.blocks }
					extraData={ this.props.refresh }
					keyExtractor={ ( item ) => item.clientId }
					renderItem={ this.renderItem.bind( this ) }
				/>
			);
		}

		const blockTypePicker = (
			<View>
				<BlockPicker
					visible={ this.state.blockTypePickerVisible }
					onDismiss={ () => {
						this.showBlockTypePicker( false );
					} }
					onValueSelected={ ( itemValue, itemIndex ) => {
						this.onBlockTypeSelected( itemValue, itemIndex );
					} } />
			</View>
		);

		return (
			<View style={ styles.container }>
				<View style={ { height: 30 } } />
				<View style={ styles.switch }>
					<Text>View html output</Text>
					<Switch
						activeText={ 'On' }
						inActiveText={ 'Off' }
						value={ this.state.showHtml }
						onValueChange={ this.handleSwitchEditor }
					/>
				</View>
				{ this.state.showHtml && this.renderHTML() }
				{ ! this.state.showHtml && list }
				{ blockTypePicker }
			</View>
		);
	}

	handleSwitchEditor = ( showHtml: boolean ) => {
		if ( showHtml ) {
			const html = this.serializeToHtml();
			this.handleHTMLUpdate( html );
		} else {
			this.parseHTML();
		}

		this.setState( { showHtml } );
	}

	handleHTMLUpdate = ( html: string ) => {
		this.setState( { html } );
	}

	renderItem( value: { item: BlockType, clientId: string } ) {
		return (
			<BlockHolder
				key={ value.clientId }
				onToolbarButtonPressed={ this.onToolbarButtonPressed.bind( this ) }
				onBlockHolderPressed={ this.onBlockHolderPressed.bind( this ) }
				onChange={ this.onChange.bind( this ) }
				focused={ value.item.focused }
				clientId={ value.clientId }
				{ ...value.item }
			/>
		);
	}

	renderHTML() {
		const behavior = Platform.OS === 'ios' ? 'padding' : null;
		return (
			<KeyboardAvoidingView style={ { flex: 1 } } behavior={ behavior }>
				<TextInput
					textAlignVertical="top"
					multiline
					numberOfLines={ 0 }
					style={ styles.htmlView }
					value={ this.state.html }
					onChangeText={ this.handleHTMLUpdate }>
				</TextInput>
			</KeyboardAvoidingView>
		);
	}
}

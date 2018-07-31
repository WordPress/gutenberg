/**
 * @format
 * @flow
 */

import React from 'react';
import { Platform, Switch, Text, View, FlatList } from 'react-native';
import RecyclerViewList, { DataSource } from 'react-native-recyclerview-list';
import BlockHolder from './block-holder';
import { ToolbarButton } from './constants';

import type { BlockType } from '../store/';

import styles from './block-manager.scss';

import { buildEmptyBlock}  from '../store/';

// Gutenberg imports
import { getBlockType, serialize } from '@wordpress/blocks';

export type BlockListType = {
	onChange: ( uid: string, attributes: mixed ) => void,
	focusBlockAction: string => mixed,
	moveBlockUpAction: string => mixed,
	moveBlockDownAction: string => mixed,
	deleteBlockAction: string => mixed,
	blocks: Array<BlockType>,
	aztechtml: string,
	refresh: boolean,
};

type PropsType = BlockListType;
type StateType = {
	dataSource: DataSource,
	showHtml: boolean,
};

export default class BlockManager extends React.Component<PropsType, StateType> {
	_recycler = null;

	constructor( props: PropsType ) {
		super( props );
		this.state = {
			dataSource: new DataSource( this.props.blocks, ( item: BlockType ) => item.uid ),
			showHtml: false,
		};
	}

	onBlockHolderPressed( uid: string ) {
		this.props.focusBlockAction( uid );
	}

	getDataSourceIndexFromUid( uid: string ) {
		for ( let i = 0; i < this.state.dataSource.size(); ++i ) {
			const block = this.state.dataSource.get( i );
			if ( block.uid === uid ) {
				return i;
			}
		}
		return -1;
	}

	onToolbarButtonPressed( button: number, uid: string ) {
		const dataSourceBlockIndex = this.getDataSourceIndexFromUid( uid );
		switch ( button ) {
			case ToolbarButton.UP:
				this.state.dataSource.moveUp( dataSourceBlockIndex );
				this.props.moveBlockUpAction( uid );
				break;
			case ToolbarButton.DOWN:
				this.state.dataSource.moveDown( dataSourceBlockIndex );
				this.props.moveBlockDownAction( uid );
				break;
			case ToolbarButton.DELETE:
				this.state.dataSource.splice( dataSourceBlockIndex, 1 );
				this.props.deleteBlockAction( uid );
				break;
			case ToolbarButton.PLUS:
				// TODO: implement creating a new block
				// FIXME: it would be nice to pass the dataSourceBlockIndex here, 
				// so in this way we know the new block should be inserted right after this one
				// instead of being appended to the end.
				
				// this.props.createBlockAction( uid, dataSourceBlockIndex );

				// this.state.dataSource.create
				// TODO: create an unique id
				const block = this.state.dataSource.get(this.state.dataSource.size() - 1);
				const newId = block.uid + 1;
				this.state.dataSource.push(buildEmptyBlock(newId, 'paragraph'));
				this.props.createBlockAction( uid );
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

	componentDidUpdate() {
		// List has been updated, tell the recycler view to update the view
		this.state.dataSource.setDirty();
	}

	onChange( uid: string, attributes: mixed ) {
		// Update datasource UI
		const index = this.getDataSourceIndexFromUid( uid );
		const dataSource = this.state.dataSource;
		const block = dataSource.get( this.getDataSourceIndexFromUid( uid ) );
		dataSource.set( index, { ...block, attributes: attributes } );
		// Update Redux store
		this.props.onChange( uid, attributes );
	}

	render() {
		let list;
		if ( Platform.OS === 'android' ) {
			list = (
				<RecyclerViewList
					ref={ ( component ) => ( this._recycler = component ) }
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
					keyExtractor={ ( item ) => item.uid }
					renderItem={ this.renderItem.bind( this ) }
				/>
			);
		}

		return (
			<View style={ styles.container }>
				<View style={ { height: 30 } } />
				<View style={ styles.switch }>
					<Text>View html output</Text>
					<Switch
						activeText={ 'On' }
						inActiveText={ 'Off' }
						value={ this.state.showHtml }
						onValueChange={ ( value ) => this.setState( { showHtml: value } ) }
					/>
				</View>
				{ this.state.showHtml && <Text style={ styles.htmlView }>{ this.serializeToHtml() }</Text> }
				{ ! this.state.showHtml && list }
			</View>
		);
	}

	renderItem( value: { item: BlockType, uid: string } ) {
		return (
			<BlockHolder
				onToolbarButtonPressed={ this.onToolbarButtonPressed.bind( this ) }
				onBlockHolderPressed={ this.onBlockHolderPressed.bind( this ) }
				onChange={ this.onChange.bind( this ) }
				focused={ value.item.focused }
				uid={ value.uid }
				{ ...value.item }
			/>
		);
	}
}

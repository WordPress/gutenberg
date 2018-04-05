/**
 * @format
 * @flow
 */

import React from 'react';
import { Platform, StyleSheet, Text, View, TextInput, FlatList } from 'react-native';
import RecyclerViewList, { DataSource } from 'react-native-recyclerview-list';
import BlockHolder from './block-holder';
import { ToolbarButton } from './constants';

import type { BlockType } from '../store/';

export type BlockListType = {
	onChange: ( uid: string, attributes: mixed ) => void,
	focusBlockAction: string => mixed,
	moveBlockUpAction: string => mixed,
	moveBlockDownAction: string => mixed,
	deleteBlockAction: string => mixed,
	blocks: Array<BlockType>,
	refresh: boolean,
};

type PropsType = BlockListType;
type StateType = {
	dataSource: DataSource,
};

export default class BlockManager extends React.Component<PropsType, StateType> {
	_recycler = null;

	constructor( props: PropsType ) {
		super( props );
		this.state = {
			dataSource: new DataSource( this.props.blocks, ( item: BlockType, index ) => item.uid ),
		};
	}

	onBlockHolderPressed( uid: string ) {
		this.props.focusBlockAction( uid );
	}

	getDataSourceIndexFromUid( uid: string ) {
		for ( var i = 0; i < this.state.dataSource.size(); ++i ) {
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
			case ToolbarButton.SETTINGS:
				// TODO: implement settings
				break;
		}
	}

	componentDidUpdate() {
		// List has been updated, tell the recycler view to update the view
		this.state.dataSource.setDirty();
	}

	render() {
		var list;
		if ( Platform.OS === 'android' ) {
			list = (
				<RecyclerViewList
					ref={ component => ( this._recycler = component ) }
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
					keyExtractor={ ( item, index ) => item.uid }
					renderItem={ this.renderItem.bind( this ) }
				/>
			);
		}

		return (
			<View style={ styles.container }>
				<View style={ { height: 30 } } />
				{ list }
			</View>
		);
	}

	renderItem( value: { item: BlockType, uid: string } ) {
		return (
			<BlockHolder
				onToolbarButtonPressed={ this.onToolbarButtonPressed.bind( this ) }
				onBlockHolderPressed={ this.onBlockHolderPressed.bind( this ) }
				onChange={ this.props.onChange.bind( this ) }
				focused={ value.item.focused }
				uid={ value.uid }
				{ ...value.item }
			/>
		);
	}
}

const styles = StyleSheet.create( {
	container: {
		flex: 1,
		backgroundColor: '#caa',
	},
	list: {
		flex: 1,
		backgroundColor: '#ccc',
	},
} );

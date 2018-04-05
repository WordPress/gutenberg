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
	dataSource: Object,
	refresh: boolean,
};

type PropsType = BlockListType;
type StateType = {};

export default class BlockManager extends React.Component<PropsType, StateType> {
	_recycler = null;

	onBlockHolderPressed( uid: string ) {
		this.props.focusBlockAction( uid );
	}

	onToolbarButtonPressed( button: number, uid: string  ) {
		switch ( button ) {
			case ToolbarButton.UP:
				this.props.moveBlockUpAction( uid );
				break;
			case ToolbarButton.DOWN:
				this.props.moveBlockDownAction( uid );
				break;
			case ToolbarButton.DELETE:
				this.props.deleteBlockAction( uid );
				break;
			case ToolbarButton.SETTINGS:
				// TODO: implement settings
				break;
		}
	}

	render() {
		const { dataSource } = this.props;
		const androidList =
				<RecyclerViewList
					ref={ component => ( this._recycler = component ) }
					style={ styles.list }
					dataSource={ dataSource }
					renderItem={ this.renderItem.bind( this ) }
					windowSize={ 20 }
					initialScrollIndex={ 0 }
					ListEmptyComponent={
						<View style={ { borderColor: '#e7e7e7', borderWidth: 10, margin: 10, padding: 20 } }>
							<Text style={ { fontSize: 15 } }>No blocnks :(</Text>
						</View>
					}
				/>

		// TODO: we won't need this. This just a temporary solution until we implement the RecyclerViewList native code for iOS
		const defaultList =
				<FlatList
					style={ styles.list }
					data={ dataSource._data }
					extraData={ this.props.refresh }
					keyExtractor={ ( item, index ) => item.uid }
					renderItem={ this.renderItem.bind( this ) }
					/>

		return (
			<View style={ styles.container }>
				<View style={ { height: 30 } } />
				{ Platform.OS === 'android' ? androidList : defaultList }
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

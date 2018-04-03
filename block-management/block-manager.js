/**
 * @format
 * @flow
 */

import React from 'react';
import { StyleSheet, Text, View, TextInput } from 'react-native';
import RecyclerViewList, { DataSource } from 'react-native-recyclerview-list';
import BlockHolder from './block-holder';
import { ToolbarButton } from './constants';

import type { BlockType } from '../store/';

export type BlockListType = {
	onChange: ( uid: string, attributes: mixed ) => void,
	focusBlockAction: number => mixed,
	moveBlockUpAction: number => mixed,
	moveBlockDownAction: number => mixed,
	deleteBlockAction: number => mixed,
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
				this.props.dataSource.moveUp( uid );
				this.props.moveBlockUpAction( uid );
				break;
			case ToolbarButton.DOWN:
				this.props.dataSource.moveDown( uid );
				this.props.moveBlockDownAction( uid );
				break;
			case ToolbarButton.DELETE:
				this.props.dataSource.splice( uid, 1 );
				this.props.deleteBlockAction( uid );
				break;
			case ToolbarButton.SETTINGS:
				// TODO: implement settings
				break;
		}
	}

	render() {
		const { dataSource } = this.props;
		return (
			<View style={ styles.container }>
				<View style={ { height: 30 } } />
				<RecyclerViewList
					ref={ component => ( this._recycler = component ) }
					style={ styles.list }
					dataSource={ dataSource }
					renderItem={ this.renderItem.bind( this ) }
					windowSize={ 20 }
					initialScrollIndex={ 0 }
					ListEmptyComponent={
						<View style={ { borderColor: '#e7e7e7', borderWidth: 10, margin: 10, padding: 20 } }>
							<Text style={ { fontSize: 15 } }>No results.</Text>
						</View>
					}
				/>
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

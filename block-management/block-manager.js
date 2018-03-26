/**
 * @format
 * @flow
 */

import React from 'react';
import { StyleSheet, Text, View, FlatList, TextInput } from 'react-native';
import BlockHolder from './block-holder';
import { ToolbarButton } from './constants';

type Block = {
	key: number,
	blockType: string,
	content: string,
	focused: boolean,
};

export type BlockListType = {
	onChange: ( number, object ) => mixed,
	focusBlockAction: number => mixed,
	moveBlockUpAction: number => mixed,
	moveBlockDownAction: number => mixed,
	deleteBlockAction: number => mixed,
	blocks: Array<Block>,
	refresh: boolean,
};

type PropsType = BlockListType;
type StateType = {};

export default class BlockManager extends React.Component<PropsType, StateType> {
	onBlockHolderPressed( rowId: number ) {
		this.props.focusBlockAction( rowId );
	}

	onToolbarButtonPressed( button: number, index: number ) {
		switch ( button ) {
			case ToolbarButton.UP:
				this.props.moveBlockUpAction( index );
				break;
			case ToolbarButton.DOWN:
				this.props.moveBlockDownAction( index );
				break;
			case ToolbarButton.DELETE:
				this.props.deleteBlockAction( index );
				break;
			case ToolbarButton.SETTINGS:
				// TODO: implement settings
				break;
		}
	}

	render() {
		return (
			<View style={ styles.container }>
				<View style={ { height: 30 } } />
				<FlatList
					style={ styles.list }
					data={ this.props.blocks }
					extraData={ this.props.refresh }
					renderItem={ this.renderItem.bind( this ) }
				/>
			</View>
		);
	}

	renderItem( value: { item: Block, index: number } ) {
		return (
			<BlockHolder
				onToolbarButtonPressed={ this.onToolbarButtonPressed.bind( this ) }
				onBlockHolderPressed={ this.onBlockHolderPressed.bind( this ) }
				onChange={ this.props.onChange.bind( this ) }
				focused={ value.item.focused }
				index={ value.index }
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

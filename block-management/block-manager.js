/**
 * @format
 * @flow
 */

import React from 'react';
import { StyleSheet, Text, View, FlatList, TextInput } from 'react-native';
import BlockHolder from './block-holder';
import { ToolbarButton } from './constants';

export type BlockArray = Array<{
	key: string,
	blockType: string,
	content: string,
	focused: boolean,
}>;
export type BlockListType = {
	focusBlockAction: number => mixed,
	blocks: BlockArray,
	refresh: boolean,
};

type PropsType = BlockListType;
type StateType = {};

export default class BlockManager extends React.Component<PropsType, StateType> {
	onBlockHolderPressed( rowId: number ) {
		this.props.focusBlockAction( rowId );
	}

	onToolbarButtonPressed( button: number, index: number ) {
		// var blocks = this.state.blocks;
		// switch ( button ) {
		// 	case ToolbarButton.UP:
		// 		if ( index == 0 ) return;
		// 		var tmp = blocks[ index ];
		// 		blocks[ index ] = blocks[ index - 1 ];
		// 		blocks[ index - 1 ] = tmp;
		// 		break;
		// 	case ToolbarButton.DOWN:
		// 		if ( index == blocks.length - 1 ) return;
		// 		var tmp = blocks[ index ];
		// 		blocks[ index ] = blocks[ index + 1 ];
		// 		blocks[ index + 1 ] = tmp;
		// 		break;
		// 	case ToolbarButton.DELETE:
		// 		blocks.splice( index, 1 );
		// 		break;
		// 	case ToolbarButton.SETTINGS:
		// 		// TODO: implement settings
		// 		break;
		// }
		// this.setState( { blocks: blocks, refresh: ! this.state.refresh } );
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

	renderItem( value: {
		item: { key: string, blockType: string, content: string, focused: boolean },
		index: number,
	} ) {
		return (
			<BlockHolder
				onToolbarButtonPressed={ this.onToolbarButtonPressed.bind( this ) }
				onBlockHolderPressed={ this.onBlockHolderPressed.bind( this ) }
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

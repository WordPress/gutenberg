/**
 * @format
 * @flow
 */

import React from 'react';
import { Switch, StyleSheet, Text, View, FlatList, TextInput } from 'react-native';
import BlockHolder from './block-holder';
import { ToolbarButton } from './constants';

import type { BlockType } from '../store/';

// Gutenberg imports
import { getBlockType, serialize } from '@gutenberg/blocks/api';

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
	showHtml: boolean,
};

export default class BlockManager extends React.Component<PropsType, StateType> {
	constructor( props: PropsType, state: StateType ) {
		super( props );

		this.state = {
			showHtml: false,
		};
	}

	onBlockHolderPressed( uid: string ) {
		this.props.focusBlockAction( uid );
	}

	onToolbarButtonPressed( button: number, uid: string ) {
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

	serializeToHtml() {
		return this.props.blocks
			.map( block => {
				const blockType = getBlockType( block.name );
				if ( blockType ) {
					return serialize( [ block ] );
				} else {
					return '<span>' + block.attributes.content + '</span>';
				}
			} )
			.reduce( ( prevVal, value ) => {
				return prevVal + value;
			}, '' );
	}

	render() {
		return (
			<View style={ styles.container }>
				<View style={ styles.switch }>
					<Text>View html output</Text>
					<Switch
						activeText={ 'On' }
						inActiveText={ 'Off' }
						value={ this.state.showHtml }
						onValueChange={ value => this.setState( { showHtml: value } ) }
					/>
				</View>
				{ this.state.showHtml && <Text style={ styles.list }>{ this.serializeToHtml() }</Text> }
				{ ! this.state.showHtml && (
					<FlatList
						style={ styles.list }
						data={ this.props.blocks }
						extraData={ this.props.refresh }
						keyExtractor={ ( item, index ) => item.uid }
						renderItem={ this.renderItem.bind( this ) }
					/>
				) }
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
		justifyContent: 'flex-start',
		backgroundColor: '#caa',
	},
	list: {
		flex: 1,
		backgroundColor: '#ccc',
	},
	htmlView: {
		flex: 1,
		backgroundColor: '#fff',
	},
	switch: {
		flexDirection: 'row',
		justifyContent: 'flex-start',
		alignItems: 'center',
	},
} );

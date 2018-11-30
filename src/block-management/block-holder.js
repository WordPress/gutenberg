/**
* @format
* @flow
*/

import React from 'react';
import { View, Text, TouchableWithoutFeedback } from 'react-native';
import InlineToolbar from './inline-toolbar';

import { withDispatch, withSelect } from '@wordpress/data';
import { compose } from '@wordpress/compose';

import type { BlockType } from '../store/types';

import styles from './block-holder.scss';

// Gutenberg imports
import { BlockEdit } from '@wordpress/editor';

type PropsType = BlockType & {
	isSelected: boolean,
	showTitle: boolean,
	onChange: ( clientId: string, attributes: mixed ) => void,
	onReplace: ( blocks: Array<Object> ) => void,
	onInlineToolbarButtonPressed: ( button: number, clientId: string ) => void,
	onSelect: void => void,
	insertBlocksAfter: ( blocks: Array<Object> ) => void,
	mergeBlocks: ( forward: boolean ) => void,
	canMoveUp: boolean,
	canMoveDown: boolean,
};

export class BlockHolder extends React.Component<PropsType> {
	renderToolbarIfBlockFocused() {
		if ( this.props.isSelected ) {
			return (
				<InlineToolbar
					clientId={ this.props.clientId }
					onButtonPressed={ this.props.onInlineToolbarButtonPressed }
					canMoveUp={ this.props.canMoveUp }
					canMoveDown={ this.props.canMoveDown }
				/>
			);
		}

		// Return empty view, toolbar won't be rendered
		return <View />;
	}

	getBlockForType() {
		return (
			<BlockEdit
				name={ this.props.name }
				isSelected={ this.props.isSelected }
				attributes={ { ...this.props.attributes } }
				// pass a curried version of onChanged with just one argument
				setAttributes={ ( attrs ) =>
					this.props.onChange( this.props.clientId, { ...this.props.attributes, ...attrs } )
				}
				onFocus={ this.props.onSelect }
				onReplace={ this.props.onReplace }
				insertBlocksAfter={ this.props.insertBlocksAfter }
				mergeBlocks={ this.props.mergeBlocks }
			/>
		);
	}

	renderBlockTitle() {
		return (
			<View style={ styles.blockTitle }>
				<Text>BlockType: { this.props.name }</Text>
			</View>
		);
	}

	render() {
		const { focused } = this.props;

		return (
			<TouchableWithoutFeedback onPress={ this.props.onSelect } >
				<View style={ [ styles.blockHolder, focused && styles.blockHolderFocused ] }>
					{ this.props.showTitle && this.renderBlockTitle() }
					<View style={ styles.blockContainer }>{ this.getBlockForType() }</View>
					{ this.renderToolbarIfBlockFocused() }
				</View>
			</TouchableWithoutFeedback>
		);
	}
}

export default compose( [
	withSelect( ( select, { clientId } ) => {
		const {
			isBlockSelected,
		} = select( 'core/editor' );
		const isSelected = isBlockSelected( clientId );

		return {
			isSelected,
		};
	} ),
	withDispatch( ( dispatch, { clientId } ) => {
		const {
			clearSelectedBlock,
			selectBlock,
		} = dispatch( 'core/editor' );

		return {
			onSelect: () => {
				clearSelectedBlock();
				selectBlock( clientId );
			},
		};
	} ),
] )( BlockHolder );

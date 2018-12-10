/**
 * @format
 * @flow
 */

import React from 'react';

import { Text, View, FlatList, Keyboard, LayoutChangeEvent } from 'react-native';
import BlockHolder from './block-holder';
import type { BlockType } from '../store/types';
import styles from './block-manager.scss';
import BlockPicker from './block-picker';
import HTMLTextInput from '../components/html-text-input';
import BlockToolbar from './block-toolbar';
import KeyboardAvoidingView from '../components/keyboard-avoiding-view';

// Gutenberg imports
import { withDispatch, withSelect } from '@wordpress/data';
import { compose } from '@wordpress/compose';
import { createBlock } from '@wordpress/blocks';
import { DefaultBlockAppender } from '@wordpress/editor';

type PropsType = {
	blockClientIds: Array<string>,
	blockCount: number,
	focusBlock: ( clientId: string ) => void,
	insertBlock: ( block: BlockType, position: number ) => void,
	rootClientId: ?string,
	replaceBlock: ( string, BlockType ) => mixed,
	selectedBlock: ?BlockType,
	selectedBlockClientId: string,
	selectedBlockOrder: number,
	serializeToNativeAction: void => void,
	toggleHtmlModeAction: void => void,
	updateHtmlAction: string => void,
	isBlockSelected: string => boolean,
	showHtml: boolean,
};

type StateType = {
	blockTypePickerVisible: boolean,
	isKeyboardVisible: boolean,
	rootViewHeight: number;
};

export class BlockManager extends React.Component<PropsType, StateType> {
	constructor( props: PropsType ) {
		super( props );

		this.state = {
			blockTypePickerVisible: false,
			isKeyboardVisible: false,
			rootViewHeight: 0,
		};
	}

	// TODO: in the near future this will likely be changed to onShowBlockTypePicker and bound to this.props
	// once we move the action to the toolbar
	showBlockTypePicker( show: boolean ) {
		this.setState( { blockTypePickerVisible: show } );
	}

	onBlockTypeSelected = ( itemValue: string ) => {
		this.setState( { blockTypePickerVisible: false } );

		// create an empty block of the selected type
		const newBlock = createBlock( itemValue );

		// now determine whether we need to replace the currently selected block (if it's empty)
		// or just add a new block as usual
		if ( this.isReplaceable( this.props.selectedBlock ) ) {
			// do replace here
			this.props.replaceBlock( this.props.selectedBlockClientId, newBlock );
		} else {
			const indexAfterSelected = this.props.selectedBlockOrder + 1;
			const insertionIndex = indexAfterSelected || this.props.blockCount;
			this.props.insertBlock( newBlock, insertionIndex );
		}

		// now set the focus
		this.props.focusBlock( newBlock.clientId );
	};

	onRootViewLayout = ( event: LayoutChangeEvent ) => {
		const { height } = event.nativeEvent.layout;
		this.setState( { rootViewHeight: height } );
	};

	keyboardDidShow = () => {
		this.setState( { isKeyboardVisible: true } );
	};

	keyboardDidHide = () => {
		this.setState( { isKeyboardVisible: false } );
	};

	componentDidMount() {
		Keyboard.addListener( 'keyboardDidShow', this.keyboardDidShow );
		Keyboard.addListener( 'keyboardDidHide', this.keyboardDidHide );
	}

	componentWillUnmount() {
		Keyboard.removeListener( 'keyboardDidShow', this.keyboardDidShow );
		Keyboard.removeListener( 'keyboardDidHide', this.keyboardDidHide );
	}

	renderList() {
		// TODO: we won't need this. This just a temporary solution until we implement the RecyclerViewList native code for iOS
		// And fix problems with RecyclerViewList on Android
		const list = (
			<FlatList
				keyboardShouldPersistTaps="always"
				style={ styles.list }
				data={ this.props.blockClientIds }
				keyExtractor={ ( item ) => item }
				renderItem={ this.renderItem }
			/>
		);
		return (
			<KeyboardAvoidingView style={ { flex: 1 } } parentHeight={ this.state.rootViewHeight }>
				<DefaultBlockAppender rootClientId={ this.props.rootClientId } />
				{ list }
				<BlockToolbar
					onInsertClick={ () => {
						this.showBlockTypePicker( true );
					} }
					showKeyboardHideButton={ this.state.isKeyboardVisible }
				/>
			</KeyboardAvoidingView>
		);
	}

	render() {
		return (
			<View style={ styles.container } onLayout={ this.onRootViewLayout }>
				{
					this.props.showHtml ?
						this.renderHTML() :
						this.renderList()
				}
				{ this.state.blockTypePickerVisible && (
					<BlockPicker
						onDismiss={ () => this.showBlockTypePicker( false ) }
						onValueSelected={ this.onBlockTypeSelected }
						isReplacement={ this.isReplaceable( this.props.selectedBlock ) }
					/>
				) }
			</View>
		);
	}

	isEmptyBlock( block: BlockType ) {
		const content = block.attributes.content;
		const innerBlocks = block.innerBlocks;
		return ( content === undefined || content === '' ) && ( innerBlocks.length === 0 );
	}

	isCandidateForReplaceBlock( block: BlockType ) {
		return ( block.name === 'core/paragraph' || block.name === 'core/heading' || block.name === 'core/code' );
	}

	isReplaceable( block: ?BlockType ) {
		if ( ! block ) {
			return false;
		}
		return this.isEmptyBlock( block ) && this.isCandidateForReplaceBlock( block );
	}

	renderItem = ( clientId: string ) => {
		return (
			<View>
				<BlockHolder
					key={ clientId }
					showTitle={ false }
					clientId={ clientId }
					rootClientId={ this.props.rootClientId }
				/>
				{ this.state.blockTypePickerVisible && this.props.isBlockSelected( clientId ) && (
					<View style={ styles.containerStyleAddHere } >
						<View style={ styles.lineStyleAddHere }></View>
						<Text style={ styles.labelStyleAddHere } >ADD BLOCK HERE</Text>
						<View style={ styles.lineStyleAddHere }></View>
					</View>
				) }
			</View>
		);
	};

	renderHTML() {
		return (
			<HTMLTextInput { ...this.props } />
		);
	}
}

export default compose( [
	withSelect( ( select, { rootClientId } ) => {
		const {
			getBlockCount,
			getBlockIndex,
			getBlockOrder,
			getSelectedBlock,
			getSelectedBlockClientId,
			isBlockSelected,
			getBlockMode,
		} = select( 'core/editor' );
		const selectedBlockClientId = getSelectedBlockClientId();

		return {
			blockClientIds: getBlockOrder( rootClientId ),
			blockCount: getBlockCount( rootClientId ),
			isBlockSelected,
			selectedBlock: getSelectedBlock(),
			selectedBlockClientId,
			selectedBlockOrder: getBlockIndex( selectedBlockClientId ),
			showHtml: getBlockMode() === 'html',
		};
	} ),
	withDispatch( ( dispatch ) => {
		const {
			clearSelectedBlock,
			insertBlock,
			replaceBlock,
			selectBlock,
		} = dispatch( 'core/editor' );

		return {
			clearSelectedBlock,
			insertBlock,
			focusBlock: ( clientId ) => {
				clearSelectedBlock();
				selectBlock( clientId );
			},
			replaceBlock,
		};
	} ),
] )( BlockManager );

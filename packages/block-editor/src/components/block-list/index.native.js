/**
 * External dependencies
 */
import { identity } from 'lodash';
import { Text, View, Keyboard, SafeAreaView, Platform, TouchableWithoutFeedback } from 'react-native';
import { subscribeMediaAppend } from 'react-native-gutenberg-bridge';

/**
 * WordPress dependencies
 */
import { Component, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { withDispatch, withSelect } from '@wordpress/data';
import { compose } from '@wordpress/compose';
import { createBlock, isUnmodifiedDefaultBlock } from '@wordpress/blocks';
import { HTMLTextInput, KeyboardAvoidingView, KeyboardAwareFlatList, ReadableContentView } from '@wordpress/components';

/**
 * Internal dependencies
 */
import styles from './style.scss';
import BlockListBlock from './block';
import BlockToolbar from '../block-toolbar';
import DefaultBlockAppender from '../default-block-appender';
import Inserter from '../inserter';

const blockMobileToolbarHeight = 44;
const toolbarHeight = 44;

export class BlockList extends Component {
	constructor() {
		super( ...arguments );

		this.renderItem = this.renderItem.bind( this );
		this.renderAddBlockSeparator = this.renderAddBlockSeparator.bind( this );
		this.renderBlockListFooter = this.renderBlockListFooter.bind( this );
		this.shouldFlatListPreventAutomaticScroll = this.shouldFlatListPreventAutomaticScroll.bind( this );
		this.renderDefaultBlockAppender = this.renderDefaultBlockAppender.bind( this );
		this.onBlockTypeSelected = this.onBlockTypeSelected.bind( this );
		this.keyboardDidShow = this.keyboardDidShow.bind( this );
		this.keyboardDidHide = this.keyboardDidHide.bind( this );
		this.onCaretVerticalPositionChange = this.onCaretVerticalPositionChange.bind( this );
		this.scrollViewInnerRef = this.scrollViewInnerRef.bind( this );
		this.getNewBlockInsertionIndex = this.getNewBlockInsertionIndex.bind( this );

		this.state = {
			blockTypePickerVisible: false,
			isKeyboardVisible: false,
		};
	}

	// TODO: in the near future this will likely be changed to onShowBlockTypePicker and bound to this.props
	// once we move the action to the toolbar
	showBlockTypePicker( show ) {
		this.setState( { blockTypePickerVisible: show } );
	}

	onBlockTypeSelected( itemValue ) {
		this.setState( { blockTypePickerVisible: false } );

		// create an empty block of the selected type
		const newBlock = createBlock( itemValue );

		this.finishBlockAppendingOrReplacing( newBlock );
	}

	finishBlockAppendingOrReplacing( newBlock ) {
		// now determine whether we need to replace the currently selected block (if it's empty)
		// or just add a new block as usual
		if ( this.isReplaceable( this.props.selectedBlock ) ) {
			// do replace here
			this.props.replaceBlock( this.props.selectedBlockClientId, newBlock );
		} else {
			this.props.insertBlock( newBlock, this.getNewBlockInsertionIndex() );
		}
	}

	getNewBlockInsertionIndex() {
		if ( this.props.isPostTitleSelected ) {
			// if post title selected, insert at top of post
			return 0;
		} else if ( this.props.selectedBlockOrder === -1 ) {
			// if no block selected, insert at end of post
			return this.props.blockCount;
		}
		// insert after selected block
		return this.props.selectedBlockOrder + 1;
	}

	blockHolderBorderStyle() {
		return this.state.isFullyBordered ? styles.blockHolderFullBordered : styles.blockHolderSemiBordered;
	}

	componentDidMount() {
		this._isMounted = true;
		Keyboard.addListener( 'keyboardDidShow', this.keyboardDidShow );
		Keyboard.addListener( 'keyboardDidHide', this.keyboardDidHide );

		this.subscriptionParentMediaAppend = subscribeMediaAppend( ( payload ) => {
			// create an empty media block
			const newMediaBlock = createBlock( 'core/' + payload.mediaType );

			// now set the url and id
			if ( payload.mediaType === 'image' ) {
				newMediaBlock.attributes.url = payload.mediaUrl;
			} else if ( payload.mediaType === 'video' ) {
				newMediaBlock.attributes.src = payload.mediaUrl;
			}

			newMediaBlock.attributes.id = payload.mediaId;

			// finally append or replace as appropriate
			this.finishBlockAppendingOrReplacing( newMediaBlock );
		} );
	}

	componentWillUnmount() {
		Keyboard.removeListener( 'keyboardDidShow', this.keyboardDidShow );
		Keyboard.removeListener( 'keyboardDidHide', this.keyboardDidHide );

		if ( this.subscriptionParentMediaAppend ) {
			this.subscriptionParentMediaAppend.remove();
		}
		this._isMounted = false;
	}

	keyboardDidShow() {
		this.setState( { isKeyboardVisible: true } );
	}

	keyboardDidHide() {
		this.setState( { isKeyboardVisible: false } );
	}

	onCaretVerticalPositionChange( targetId, caretY, previousCaretY ) {
		KeyboardAwareFlatList.handleCaretVerticalPositionChange( this.scrollViewRef, targetId, caretY, previousCaretY );
	}

	scrollViewInnerRef( ref ) {
		this.scrollViewRef = ref;
	}

	shouldFlatListPreventAutomaticScroll() {
		return this.state.blockTypePickerVisible;
	}

	renderDefaultBlockAppender() {
		return (
			<ReadableContentView>
				<DefaultBlockAppender
					rootClientId={ this.props.rootClientId }
					containerStyle={ [
						styles.blockContainerFocused,
						this.blockHolderBorderStyle(),
						{ borderColor: 'transparent' },
					] }
				/>
			</ReadableContentView>
		);
	}

	renderList() {
		return (
			<View
				style={ { flex: 1 } }
				onAccessibilityEscape={ this.props.clearSelectedBlock }
			>
				<KeyboardAwareFlatList
					{ ...( Platform.OS === 'android' ? { removeClippedSubviews: false } : {} ) } // Disable clipping on Android to fix focus losing. See https://github.com/wordpress-mobile/gutenberg-mobile/pull/741#issuecomment-472746541
					accessibilityLabel="block-list"
					innerRef={ this.scrollViewInnerRef }
					blockToolbarHeight={ toolbarHeight }
					innerToolbarHeight={ blockMobileToolbarHeight }
					safeAreaBottomInset={ this.props.safeAreaBottomInset }
					parentHeight={ this.props.rootViewHeight }
					keyboardShouldPersistTaps="always"
					style={ styles.list }
					data={ this.props.blockClientIds }
					extraData={ [ this.props.isFullyBordered ] }
					keyExtractor={ identity }
					renderItem={ this.renderItem }
					shouldPreventAutomaticScroll={ this.shouldFlatListPreventAutomaticScroll }
					title={ this.props.title }
					ListHeaderComponent={ this.props.header }
					ListEmptyComponent={ this.renderDefaultBlockAppender }
					ListFooterComponent={ this.renderBlockListFooter }
				/>
				<SafeAreaView>
					<View style={ { height: toolbarHeight } } />
				</SafeAreaView>
				<KeyboardAvoidingView
					style={ styles.blockToolbarKeyboardAvoidingView }
					parentHeight={ this.props.rootViewHeight }
				>
					<BlockToolbar
						onInsertClick={ () => {
							this.showBlockTypePicker( true );
						} }
						showKeyboardHideButton={ this.state.isKeyboardVisible }
					/>
				</KeyboardAvoidingView>
			</View>
		);
	}

	render() {
		return (
			<Fragment>
				{ this.renderList() }
				{ this.state.blockTypePickerVisible && (
					<Inserter
						onDismiss={ () => this.showBlockTypePicker( false ) }
						onValueSelected={ this.onBlockTypeSelected }
						isReplacement={ this.isReplaceable( this.props.selectedBlock ) }
						addExtraBottomPadding={ this.props.safeAreaBottomInset === 0 }
					/>
				) }
			</Fragment>
		);
	}

	isReplaceable( block ) {
		if ( ! block ) {
			return false;
		}
		return isUnmodifiedDefaultBlock( block );
	}

	renderItem( { item: clientId, index } ) {
		const shouldShowAddBlockSeparator = this.state.blockTypePickerVisible && ( this.props.isBlockSelected( clientId ) || ( index === 0 && this.props.isPostTitleSelected ) );
		const shouldPutAddBlockSeparatorAboveBlock = this.isReplaceable( this.props.selectedBlock ) || this.props.isPostTitleSelected;

		return (
			<ReadableContentView reversed={ shouldPutAddBlockSeparatorAboveBlock }>
				<BlockListBlock
					key={ clientId }
					showTitle={ false }
					clientId={ clientId }
					rootClientId={ this.props.rootClientId }
					onCaretVerticalPositionChange={ this.onCaretVerticalPositionChange }
					borderStyle={ this.blockHolderBorderStyle() }
					focusedBorderColor={ styles.blockHolderFocused.borderColor }
				/>
				{ shouldShowAddBlockSeparator && this.renderAddBlockSeparator() }
			</ReadableContentView>
		);
	}

	renderAddBlockSeparator() {
		return (
			<View style={ styles.containerStyleAddHere } >
				<View style={ styles.lineStyleAddHere }></View>
				<Text style={ styles.labelStyleAddHere } >{ __( 'ADD BLOCK HERE' ) }</Text>
				<View style={ styles.lineStyleAddHere }></View>
			</View>
		);
	}

	renderBlockListFooter() {
		const paragraphBlock = createBlock( 'core/paragraph' );
		return (
			<TouchableWithoutFeedback onPress={ () => {
				this.finishBlockAppendingOrReplacing( paragraphBlock );
			} } >
				<View style={ styles.blockListFooter } />
			</TouchableWithoutFeedback>
		);
	}

	renderHTML() {
		return (
			<HTMLTextInput { ...this.props } parentHeight={ this.props.rootViewHeight } />
		);
	}
}

export default compose( [
	withSelect( ( select, { rootClientId } ) => {
		const {
			getBlockCount,
			getBlockName,
			getBlockIndex,
			getBlockOrder,
			getSelectedBlock,
			getSelectedBlockClientId,
			isBlockSelected,
		} = select( 'core/block-editor' );

		const selectedBlockClientId = getSelectedBlockClientId();

		return {
			blockClientIds: getBlockOrder( rootClientId ),
			blockCount: getBlockCount( rootClientId ),
			getBlockName,
			isBlockSelected,
			selectedBlock: getSelectedBlock(),
			selectedBlockClientId,
			selectedBlockOrder: getBlockIndex( selectedBlockClientId ),
		};
	} ),
	withDispatch( ( dispatch ) => {
		const {
			insertBlock,
			replaceBlock,
			clearSelectedBlock,
		} = dispatch( 'core/block-editor' );

		return {
			clearSelectedBlock,
			insertBlock,
			replaceBlock,
		};
	} ),
] )( BlockList );


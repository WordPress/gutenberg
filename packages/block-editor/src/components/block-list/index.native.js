/**
 * External dependencies
 */
import { identity } from 'lodash';
import { Text, View, Keyboard, SafeAreaView, Platform } from 'react-native';

/**
 * WordPress dependencies
 */
import { Component, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { withDispatch, withSelect } from '@wordpress/data';
import { compose } from '@wordpress/compose';
import { createBlock, isUnmodifiedDefaultBlock } from '@wordpress/blocks';
import { KeyboardAvoidingView, KeyboardAwareFlatList, ReadableContentView } from '@wordpress/components';
import { subscribeMediaAppend } from 'react-native-gutenberg-bridge';

/**
 * Internal dependencies
 */
import BlockListBlock from './block';
import styles from './style.scss';
import blockHolderStyles from './block.scss';
import inlineToolbarStyles from '../block-inspector/style.scss';
import toolbarStyles from '../block-toolbar/style.scss';
import BlockToolbar from '../block-toolbar';
import DefaultBlockAppender from '../default-block-appender';
import Inserter from '../inserter';

export class BlockList extends Component {
	constructor( ...args ) {
		super( ...args );

		this.renderItem = this.renderItem.bind( this );
		this.shouldFlatListPreventAutomaticScroll = this.shouldFlatListPreventAutomaticScroll.bind( this );
		this.renderDefaultBlockAppender = this.renderDefaultBlockAppender.bind( this );
		this.onBlockTypeSelected = this.onBlockTypeSelected.bind( this );
		this.keyboardDidShow = this.keyboardDidShow.bind( this );
		this.keyboardDidHide = this.keyboardDidHide.bind( this );
		this.onCaretVerticalPositionChange = this.onCaretVerticalPositionChange.bind( this );
		this.scrollViewInnerRef = this.scrollViewInnerRef.bind( this );

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
			const indexAfterSelected = this.props.selectedBlockOrder + 1;
			const insertionIndex = indexAfterSelected || this.props.blockCount;
			this.props.insertBlock( newBlock, insertionIndex );
		}

		// now set the focus
		this.props.focusBlock( newBlock.clientId );
	}

	blockHolderBorderStyle() {
		return this.props.isFullyBordered ? styles.blockHolderFullBordered : styles.blockHolderSemiBordered;
	}

	componentDidMount() {
		this._isMounted = true;
		Keyboard.addListener( 'keyboardDidShow', this.keyboardDidShow );
		Keyboard.addListener( 'keyboardDidHide', this.keyboardDidHide );

		this.subscriptionParentMediaAppend = subscribeMediaAppend( ( payload ) => {
			// create an empty image block
			const newImageBlock = createBlock( 'core/image' );

			// now set the url and id
			newImageBlock.attributes.url = payload.mediaUrl;
			newImageBlock.attributes.id = payload.mediaId;

			// finally append or replace as appropriate
			this.finishBlockAppendingOrReplacing( newImageBlock );
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
						blockHolderStyles.blockContainerFocused,
						this.blockHolderBorderStyle(),
						{ borderColor: 'transparent' },
					] }
				/>
			</ReadableContentView>
		);
	}

	renderList() {
		return (
			<View style={ { flex: 1 } } >
				<KeyboardAwareFlatList
					{ ...( Platform.OS === 'android' ? { removeClippedSubviews: false } : {} ) } // Disable clipping on Android to fix focus losing. See https://github.com/wordpress-mobile/gutenberg-mobile/pull/741#issuecomment-472746541
					innerRef={ this.scrollViewInnerRef }
					blockToolbarHeight={ toolbarStyles.container.height }
					innerToolbarHeight={ inlineToolbarStyles.toolbar.height + blockHolderStyles.blockContainerFocused.paddingBottom }
					safeAreaBottomInset={ this.props.safeAreaBottomInset }
					parentHeight={ this.props.rootViewHeight }
					keyboardShouldPersistTaps="always"
					style={ styles.list }
					data={ this.props.blockClientIds }
					extraData={ [ this.props.isFullyBordered ] }
					keyExtractor={ identity }
					renderItem={ this.renderItem }
					shouldPreventAutomaticScroll={ this.shouldFlatListPreventAutomaticScroll }
					ListHeaderComponent={ this.props.header }
					ListEmptyComponent={ this.renderDefaultBlockAppender }
				/>
				<SafeAreaView>
					<View style={ { height: toolbarStyles.container.height } } />
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

	renderItem( value ) {
		const clientId = value.item;

		return (
			<ReadableContentView>
				<BlockListBlock
					key={ clientId }
					showTitle={ false }
					clientId={ clientId }
					rootClientId={ this.props.rootClientId }
					onCaretVerticalPositionChange={ this.onCaretVerticalPositionChange }
					borderStyle={ this.blockHolderBorderStyle() }
					focusedBorderColor={ styles.blockHolderFocused.borderColor }
				/>
				{ this.state.blockTypePickerVisible && this.props.isBlockSelected( clientId ) && (
					<View style={ styles.containerStyleAddHere } >
						<View style={ styles.lineStyleAddHere }></View>
						<Text style={ styles.labelStyleAddHere } >{ __( 'ADD BLOCK HERE' ) }</Text>
						<View style={ styles.lineStyleAddHere }></View>
					</View>
				) }
			</ReadableContentView>
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
		} = select( 'core/block-editor' );

		const selectedBlockClientId = getSelectedBlockClientId();

		return {
			blockClientIds: getBlockOrder( rootClientId ),
			blockCount: getBlockCount( rootClientId ),
			isBlockSelected,
			selectedBlock: getSelectedBlock(),
			selectedBlockClientId,
			selectedBlockOrder: getBlockIndex( selectedBlockClientId ),
		};
	} ),
	withDispatch( ( dispatch ) => {
		const {
			clearSelectedBlock,
			insertBlock,
			replaceBlock,
			selectBlock,
		} = dispatch( 'core/block-editor' );

		return {
			insertBlock,
			focusBlock: ( clientId ) => {
				clearSelectedBlock();
				selectBlock( clientId );
			},
			replaceBlock,
		};
	} ),
] )( BlockList );

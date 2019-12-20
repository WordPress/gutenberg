/**
 * External dependencies
 */
import RNReactNativeGutenbergBridge, {
	subscribeParentGetHtml,
	subscribeParentToggleHTMLMode,
	subscribeUpdateHtml,
	subscribeSetTitle,
	subscribeMediaAppend,
} from 'react-native-gutenberg-bridge';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { parse, serialize, getUnregisteredTypeHandlerName, createBlock } from '@wordpress/blocks';
import { withDispatch, withSelect } from '@wordpress/data';
import { compose } from '@wordpress/compose';
import { doAction } from '@wordpress/hooks';

const postTypeEntities = [
	{ name: 'post', baseURL: '/wp/v2/posts' },
	{ name: 'page', baseURL: '/wp/v2/pages' },
	{ name: 'attachment', baseURL: '/wp/v2/media' },
	{ name: 'wp_block', baseURL: '/wp/v2/blocks' },
].map( ( postTypeEntity ) => ( {
	kind: 'postType',
	...postTypeEntity,
	transientEdits: {
		blocks: true,
	},
	mergedEdits: {
		meta: true,
	},
} ) );

/**
 * Internal dependencies
 */
import EditorProvider from './index.js';

class NativeEditorProvider extends Component {
	constructor() {
		super( ...arguments );

		// Keep a local reference to `post` to detect changes
		this.post = this.props.post;
		this.props.addEntities( postTypeEntities );
		this.props.receiveEntityRecords( 'postType', this.post.type, this.post );
	}

	componentDidMount() {
		this.subscriptionParentGetHtml = subscribeParentGetHtml( () => {
			this.serializeToNativeAction();
		} );

		this.subscriptionParentToggleHTMLMode = subscribeParentToggleHTMLMode( () => {
			this.toggleMode();
		} );

		this.subscriptionParentSetTitle = subscribeSetTitle( ( payload ) => {
			this.props.editTitle( payload.title );
		} );

		this.subscriptionParentUpdateHtml = subscribeUpdateHtml( ( payload ) => {
			this.updateHtmlAction( payload.html );
		} );

		this.subscriptionParentMediaAppend = subscribeMediaAppend( ( payload ) => {
			const blockName = 'core/' + payload.mediaType;
			const newBlock = createBlock( blockName, {
				id: payload.mediaId,
				[ payload.mediaType === 'image' ? 'url' : 'src' ]: payload.mediaUrl,
			} );

			const indexAfterSelected = this.props.selectedBlockIndex + 1;
			const insertionIndex = indexAfterSelected || this.props.blockCount;

			this.props.insertBlock( newBlock, insertionIndex );
		} );
	}

	componentWillUnmount() {
		if ( this.subscriptionParentGetHtml ) {
			this.subscriptionParentGetHtml.remove();
		}

		if ( this.subscriptionParentToggleHTMLMode ) {
			this.subscriptionParentToggleHTMLMode.remove();
		}

		if ( this.subscriptionParentSetTitle ) {
			this.subscriptionParentSetTitle.remove();
		}

		if ( this.subscriptionParentUpdateHtml ) {
			this.subscriptionParentUpdateHtml.remove();
		}

		if ( this.subscriptionParentMediaAppend ) {
			this.subscriptionParentMediaAppend.remove();
		}
	}

	componentDidUpdate( prevProps ) {
		if ( ! prevProps.isReady && this.props.isReady ) {
			const blocks = this.props.blocks;
			const isUnsupportedBlock = ( { name } ) => name === getUnregisteredTypeHandlerName();
			const unsupportedBlockNames = blocks.filter( isUnsupportedBlock ).map( ( block ) => block.attributes.originalName );
			RNReactNativeGutenbergBridge.editorDidMount( unsupportedBlockNames );
		}
	}

	serializeToNativeAction() {
		if ( this.props.mode === 'text' ) {
			// The HTMLTextInput component does not update the store when user is doing changes
			// Let's request a store update when parent is asking for it
			doAction( 'native-editor.persist-html', 'core/editor' );
		}

		const html = serialize( this.props.blocks );
		const title = this.props.title;

		const hasChanges = title !== this.post.title.raw || html !== this.post.content.raw;

		RNReactNativeGutenbergBridge.provideToNative_Html( html, title, hasChanges );

		if ( hasChanges ) {
			this.post.title.raw = title;
			this.post.content.raw = html;
		}
	}

	updateHtmlAction( html ) {
		const parsed = parse( html );
		this.props.resetEditorBlocksWithoutUndoLevel( parsed );
	}

	toggleMode() {
		const { mode, switchMode } = this.props;
		// refresh html content first
		this.serializeToNativeAction();
		// make sure to blur the selected block and dismiss the keyboard
		this.props.clearSelectedBlock();
		switchMode( mode === 'visual' ? 'text' : 'visual' );
	}

	render() {
		const {
			children,
			post, // eslint-disable-line no-unused-vars
			...props
		} = this.props;

		return (
			<EditorProvider post={ this.post } { ...props }>
				{ children }
			</EditorProvider>
		);
	}
}

export default compose( [
	withSelect( ( select, { rootClientId } ) => {
		const {
			__unstableIsEditorReady: isEditorReady,
			getEditorBlocks,
			getEditedPostAttribute,
			getEditedPostContent,
		} = select( 'core/editor' );
		const {
			getEditorMode,
		} = select( 'core/edit-post' );

		const {
			getBlockCount,
			getBlockIndex,
			getSelectedBlockClientId,
		} = select( 'core/block-editor' );

		const selectedBlockClientId = getSelectedBlockClientId();
		return {
			mode: getEditorMode(),
			isReady: isEditorReady(),
			blocks: getEditorBlocks(),
			title: getEditedPostAttribute( 'title' ),
			getEditedPostContent,
			selectedBlockIndex: getBlockIndex( selectedBlockClientId ),
			blockCount: getBlockCount( rootClientId ),
		};
	} ),
	withDispatch( ( dispatch ) => {
		const {
			editPost,
			resetEditorBlocks,
		} = dispatch( 'core/editor' );
		const {
			clearSelectedBlock,
			insertBlock,
		} = dispatch( 'core/block-editor' );
		const {
			switchEditorMode,
		} = dispatch( 'core/edit-post' );
		const {
			addEntities,
			receiveEntityRecords,
		} = dispatch( 'core' );

		return {
			addEntities,
			clearSelectedBlock,
			insertBlock,
			editTitle( title ) {
				editPost( { title } );
			},
			receiveEntityRecords,
			resetEditorBlocksWithoutUndoLevel( blocks ) {
				resetEditorBlocks( blocks, {
					__unstableShouldCreateUndoLevel: false,
				} );
			},
			switchMode( mode ) {
				switchEditorMode( mode );
			},
		};
	} ),
] )( NativeEditorProvider );

/**
 * External dependencies
 */
import RNReactNativeGutenbergBridge, {
	subscribeParentGetHtml,
	subscribeParentToggleHTMLMode,
	subscribeUpdateHtml,
	subscribeSetFocusOnTitle,
	subscribeSetTitle,
} from 'react-native-gutenberg-bridge';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { parse, serialize, getUnregisteredTypeHandlerName } from '@wordpress/blocks';
import { withDispatch, withSelect } from '@wordpress/data';
import { compose } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import EditorProvider from './index.js';

class NativeEditorProvider extends Component {
	constructor( props ) {
		super( ...arguments );

		// Keep a local reference to `post` to detect changes
		this.post = props.post;

		this.setTitleRef = this.setTitleRef.bind( this );
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

		this.subscriptionParentSetFocusOnTitle = subscribeSetFocusOnTitle( () => {
			if ( this.postTitleRef ) {
				this.postTitleRef.focus();
			}
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

		if ( this.subscriptionParentSetFocusOnTitle ) {
			this.subscriptionParentSetFocusOnTitle.remove();
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

	setTitleRef( titleRef ) {
		this.postTitleRef = titleRef;
	}

	serializeToNativeAction() {
		if ( this.props.mode === 'text' ) {
			this.updateHtmlAction( this.props.getEditedPostContent() );
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
	withSelect( ( select ) => {
		const {
			__unstableIsEditorReady: isEditorReady,
			getEditorBlocks,
			getEditedPostAttribute,
			getEditedPostContent,
		} = select( 'core/editor' );
		const {
			getEditorMode,
		} = select( 'core/edit-post' );

		return {
			mode: getEditorMode(),
			isReady: isEditorReady(),
			blocks: getEditorBlocks(),
			title: getEditedPostAttribute( 'title' ),
			getEditedPostContent,
		};
	} ),
	withDispatch( ( dispatch ) => {
		const {
			editPost,
			resetEditorBlocks,
		} = dispatch( 'core/editor' );
		const {
			clearSelectedBlock,
		} = dispatch( 'core/block-editor' );
		const {
			switchEditorMode,
		} = dispatch( 'core/edit-post' );

		return {
			clearSelectedBlock,
			editTitle( title ) {
				editPost( { title } );
			},
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

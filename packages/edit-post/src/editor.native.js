/**
 * External dependencies
 */
import RNReactNativeGutenbergBridge, {
	subscribeParentGetHtml,
	subscribeParentToggleHTMLMode,
	subscribeUpdateHtml,
	subscribeSetFocusOnTitle,
	subscribeSetTitle,
	sendNativeEditorDidLayout,
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
import Layout from './components/layout';

class Editor extends Component {
	constructor( props ) {
		super( ...arguments );

		this.setTitleRef = this.setTitleRef.bind( this );

		// TODO: use EditorProvider instead
		this.post = props.post || {
			id: 1,
			title: {
				raw: props.initialTitle,
			},
			content: {
				raw: props.initialHtml || '',
			},
			type: 'draft',
		};

		props.setupEditor( this.post );

		// make sure the post content is in sync with gutenberg store
		// to avoid marking the post as modified when simply loaded
		// For now, let's assume: serialize( parse( html ) ) !== html
		this.post.content.raw = serialize( props.getEditorBlocks() );

		if ( props.initialHtmlModeEnabled && props.mode === 'visual' ) {
			// enable html mode if the initial mode the parent wants it but we're not already in it
			this.toggleMode();
		}
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

	serializeToNativeAction() {
		if ( this.props.mode === 'text' ) {
			this.updateHtmlAction( this.props.getEditedPostContent() );
		}

		const html = serialize( this.props.getEditorBlocks() );
		const title = this.props.getEditedPostAttribute( 'title' );

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
		switchMode( mode === 'visual' ? 'text' : 'visual' );
	}

	componentDidUpdate( prevProps ) {
		if ( ! prevProps.isReady && this.props.isReady ) {
			const blocks = this.props.getEditorBlocks();
			const isUnsupportedBlock = ( { name } ) => name === getUnregisteredTypeHandlerName();
			const unsupportedBlockNames = blocks.filter( isUnsupportedBlock ).map( ( block ) => block.attributes.originalName );
			RNReactNativeGutenbergBridge.editorDidMount( unsupportedBlockNames );
		}
	}

	setTitleRef( titleRef ) {
		this.postTitleRef = titleRef;
	}

	render() {
		return (
			<Layout
				setTitleRef={ this.setTitleRef }
				onNativeEditorDidLayout={ sendNativeEditorDidLayout }
			/>
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
			getEditorBlocks,
			getEditedPostAttribute,
			getEditedPostContent,
		};
	} ),
	withDispatch( ( dispatch ) => {
		const {
			editPost,
			setupEditor,
			resetEditorBlocks,
		} = dispatch( 'core/editor' );
		const {
			switchEditorMode,
		} = dispatch( 'core/edit-post' );

		return {
			editTitle( title ) {
				editPost( { title } );
			},
			resetEditorBlocksWithoutUndoLevel( blocks ) {
				resetEditorBlocks( blocks, {
					__unstableShouldCreateUndoLevel: false,
				} );
			},
			setupEditor,
			switchMode( mode ) {
				switchEditorMode( mode );
			},
		};
	} ),
] )( Editor );

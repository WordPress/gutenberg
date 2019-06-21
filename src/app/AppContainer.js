/** @flow
 * @format */

/**
 * External dependencies
 */
import React from 'react';
import { type EmitterSubscription, type InputText } from 'react-native';
import RNReactNativeGutenbergBridge, {
	subscribeParentGetHtml,
	subscribeParentToggleHTMLMode,
	subscribeUpdateHtml,
	subscribeSetFocusOnTitle,
	subscribeSetTitle,
	sendNativeEditorDidLayout,
} from 'react-native-gutenberg-bridge';
import { isEmpty } from 'lodash';

/**
 * WordPress dependencies
 */
import { parse, serialize, getUnregisteredTypeHandlerName } from '@wordpress/blocks';
import { withDispatch, withSelect } from '@wordpress/data';
import { compose } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import type { BlockType } from '../store/types';
import MainScreen from './MainScreen';

type PostType = {
	id: number;
	title: { raw: string };
	content: { raw: string };
	type: string;
};

type PropsType = {
	initialHtmlModeEnabled: boolean,
	initialTitle: string,
	initialHtml: string,
	resetEditorBlocksWithoutUndoLevel: Array<BlockType> => mixed,
	setupEditor: ( mixed, ?mixed ) => mixed,
	toggleEditorMode: ?string => mixed,
	isReady: boolean,
	mode: string,
	post: ?PostType,
	getEditorBlocks: () => Array<BlockType>,
	getEditedPostAttribute: ( string ) => string,
	getEditedPostContent: () => string,
	switchMode: string => mixed,
	editTitle: string => void,
};

/*
 * This container combines features similar to the following components on Gutenberg:
 * - `gutenberg/packages/editor/src/components/provider/index.js`
 * - `gutenberg/packages/edit-post/src/components/layout/index.js`
 */
class AppContainer extends React.Component<PropsType> {
	post: PostType;
	postTitleRef: ?InputText;
	subscriptionParentGetHtml: ?EmitterSubscription;
	subscriptionParentToggleHTMLMode: ?EmitterSubscription;
	subscriptionParentSetTitle: ?EmitterSubscription;
	subscriptionParentUpdateHtml: ?EmitterSubscription;
	subscriptionParentSetFocusOnTitle: ?EmitterSubscription;

	constructor( props: PropsType ) {
		super( props );

		( this: any ).setTitleRef = this.setTitleRef.bind( this );

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
		this.post.content.raw = serialize( this.props.getEditorBlocks() );

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

	updateHtmlAction( html: string = '' ) {
		const parsed = parse( html );
		this.props.resetEditorBlocksWithoutUndoLevel( parsed );
	}

	toggleMode() {
		const { mode, switchMode } = this.props;
		switchMode( mode === 'visual' ? 'text' : 'visual' );
	}

	componentDidUpdate( prevProps ) {
		if ( ! prevProps.isReady && this.props.isReady ) {
			const blocks = this.props.getEditorBlocks();
			const isUnsupportedBlock = ( { name } ) => name === getUnregisteredTypeHandlerName();
			const unsupportedBlocks = blocks.filter( isUnsupportedBlock );
			const hasUnsupportedBlocks = ! isEmpty( unsupportedBlocks );

			RNReactNativeGutenbergBridge.editorDidMount( hasUnsupportedBlocks );
		}
	}

	setTitleRef( titleRef: ?InputText ) {
		this.postTitleRef = titleRef;
	}

	render() {
		return (
			<MainScreen
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
] )( AppContainer );

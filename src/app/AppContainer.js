/** @flow
 * @format */

/**
 * External dependencies
 */
import React from 'react';
import type { EmitterSubscription } from 'react-native';
import RNReactNativeGutenbergBridge, {
	subscribeParentGetHtml,
	subscribeParentToggleHTMLMode,
	subscribeSetTitle,
	subscribeUpdateHtml,
} from 'react-native-gutenberg-bridge';
import { isEmpty } from 'lodash';

/**
 * WordPress dependencies
 */
import { parse, serialize, getUnregisteredTypeHandlerName } from '@wordpress/blocks';
import { withDispatch, withSelect } from '@wordpress/data';
import { compose } from '@wordpress/compose';
import { BlockEditorProvider } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import type { BlockType } from '../store/types';
import BlockManager from '../block-management/block-manager';

type PropsType = {
	initialHtmlModeEnabled: boolean,
	editorMode: string,
	editedPostContent: string,
	title: string,
	initialTitle: string,
	initialHtml: string,
	editTitle: string => mixed,
	resetEditorBlocks: Array<BlockType> => mixed,
	resetEditorBlocksWithoutUndoLevel: Array<BlockType> => mixed,
	setupEditor: ( mixed, ?mixed ) => mixed,
	toggleEditorMode: ?string => mixed,
	blocks: Array<BlockType>,
	isReady: boolean,
	mode: string,
	post: ?mixed,
	getEditedPostContent: () => string,
	switchMode: string => mixed,
};

/*
 * This container combines features similar to the following components on Gutenberg:
 * - `gutenberg/packages/editor/src/components/provider/index.js`
 * - `gutenberg/packages/edit-post/src/components/layout/index.js`
 */
class AppContainer extends React.Component<PropsType> {
	lastHtml: ?string;
	lastTitle: ?string;
	subscriptionParentGetHtml: ?EmitterSubscription;
	subscriptionParentToggleHTMLMode: ?EmitterSubscription;
	subscriptionParentSetTitle: ?EmitterSubscription;
	subscriptionParentUpdateHtml: ?EmitterSubscription;

	constructor( props: PropsType ) {
		super( props );

		const post = props.post || {
			id: 1,
			title: {
				raw: props.initialTitle,
			},
			content: {
				raw: props.initialHtml || '',
			},
			type: 'draft',
		};

		props.setupEditor( post );
		this.lastHtml = serialize( parse( props.initialHtml || '' ) );
		this.lastTitle = props.initialTitle;

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
	}

	serializeToNativeAction() {
		if ( this.props.mode === 'text' ) {
			this.updateHtmlAction( this.props.getEditedPostContent() );
		}

		const html = serialize( this.props.blocks );
		const title = this.props.title;

		const hasChanges = title !== this.lastTitle || html !== this.lastHtml;

		RNReactNativeGutenbergBridge.provideToNative_Html( html, title, hasChanges );

		this.lastTitle = title;
		this.lastHtml = html;
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
		if ( ! prevProps.isReady && ( prevProps.isReady !== this.props.isReady ) ) {
			const { blocks } = this.props;
			const isUnsupportedBlock = ( { name } ) => name === getUnregisteredTypeHandlerName();
			const unsupportedBlocks = blocks.filter( isUnsupportedBlock );
			const hasUnsupportedBlocks = ! isEmpty( unsupportedBlocks );

			RNReactNativeGutenbergBridge.editorDidMount( hasUnsupportedBlocks );
		}
	}

	render() {
		const {
			blocks,
			editTitle,
			isReady,
			mode,
			resetEditorBlocks,
			resetEditorBlocksWithoutUndoLevel,
			title,
		} = this.props;

		if ( ! isReady ) {
			return null;
		}

		return (
			<BlockEditorProvider
				value={ blocks }
				onInput={ resetEditorBlocksWithoutUndoLevel }
				onChange={ resetEditorBlocks }
				settings={ null }
			>
				<BlockManager
					title={ title }
					setTitleAction={ editTitle }
					showHtml={ mode === 'text' }
				/>
			</BlockEditorProvider>
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
			isReady: isEditorReady(),
			blocks: getEditorBlocks(),
			mode: getEditorMode(),
			title: getEditedPostAttribute( 'title' ),
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
			resetEditorBlocks,
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

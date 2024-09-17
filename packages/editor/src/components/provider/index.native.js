/**
 * External dependencies
 */
import { BackHandler } from 'react-native';
import memize from 'memize';
import { SafeAreaProvider } from 'react-native-safe-area-context';

/**
 * WordPress dependencies
 */
import RNReactNativeGutenbergBridge, {
	requestBlockTypeImpressions,
	setBlockTypeImpressions,
	subscribeParentGetHtml,
	subscribeParentToggleHTMLMode,
	subscribeUpdateHtml,
	subscribeSetTitle,
	subscribeMediaAppend,
	subscribeReplaceBlock,
	subscribeUpdateEditorSettings,
	subscribeUpdateCapabilities,
	subscribeShowNotice,
	subscribeShowEditorHelp,
	subscribeToContentUpdate,
} from '@wordpress/react-native-bridge';
import { Component } from '@wordpress/element';
import { count as wordCount } from '@wordpress/wordcount';
import {
	parse,
	serialize,
	getUnregisteredTypeHandlerName,
	getBlockType,
	createBlock,
	pasteHandler,
} from '@wordpress/blocks';
import { withDispatch, withSelect } from '@wordpress/data';
import { compose } from '@wordpress/compose';
import { applyFilters } from '@wordpress/hooks';
import {
	store as blockEditorStore,
	getGlobalStyles,
	getColorsAndGradients,
} from '@wordpress/block-editor';
import { NEW_BLOCK_TYPES } from '@wordpress/block-library';
import { __ } from '@wordpress/i18n';

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
		selection: true,
	},
	mergedEdits: {
		meta: true,
	},
	rawAttributes: [ 'title', 'excerpt', 'content' ],
} ) );
import { EditorHelpTopics, store as editorStore } from '@wordpress/editor';
import { store as noticesStore } from '@wordpress/notices';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import EditorProvider from './index.js';
import { insertContentWithTitle } from '../post-title';

class NativeEditorProvider extends Component {
	constructor() {
		super( ...arguments );

		// Keep a local reference to `post` to detect changes.
		this.post = this.props.post;
		this.props.addEntities( postTypeEntities );
		this.props.receiveEntityRecords(
			'postType',
			this.post.type,
			this.post
		);

		this.onHardwareBackPress = this.onHardwareBackPress.bind( this );
		this.onContentUpdate = this.onContentUpdate.bind( this );

		this.getEditorSettings = memize(
			( settings, capabilities ) => ( {
				...settings,
				capabilities,
			} ),
			{
				maxSize: 1,
			}
		);
		this.state = {
			isHelpVisible: false,
		};
	}

	componentDidMount() {
		const {
			capabilities,
			createErrorNotice,
			locale,
			hostAppNamespace,
			updateEditorSettings,
			updateBlockEditorSettings,
		} = this.props;

		updateEditorSettings( {
			capabilities,
			...this.getThemeColors( this.props ),
			locale,
			hostAppNamespace,
		} );

		this.subscriptionParentGetHtml = subscribeParentGetHtml( () => {
			this.serializeToNativeAction();
		} );

		this.subscriptionParentToggleHTMLMode = subscribeParentToggleHTMLMode(
			() => {
				this.toggleMode();
			}
		);

		this.subscriptionParentSetTitle = subscribeSetTitle( ( payload ) => {
			this.props.editTitle( payload.title );
		} );

		this.subscriptionParentUpdateHtml = subscribeUpdateHtml(
			( payload ) => {
				this.updateHtmlAction( payload.html );
			}
		);

		this.subscriptionParentReplaceBlock = subscribeReplaceBlock(
			( payload ) => {
				this.replaceBlockAction( payload.html, payload.clientId );
			}
		);

		this.subscriptionParentMediaAppend = subscribeMediaAppend(
			( payload ) => {
				const blockName = 'core/' + payload.mediaType;
				const blockType = getBlockType( blockName );

				if ( blockType && blockType?.name ) {
					const newBlock = createBlock( blockType.name, {
						id: payload.mediaId,
						[ payload.mediaType === 'image' ? 'url' : 'src' ]:
							payload.mediaUrl,
					} );

					const indexAfterSelected =
						this.props.selectedBlockIndex + 1;
					const insertionIndex =
						indexAfterSelected || this.props.blockCount;

					this.props.insertBlock( newBlock, insertionIndex );
				} else {
					createErrorNotice(
						__( 'File type not supported as a media file.' )
					);
				}
			}
		);

		this.subscriptionParentUpdateEditorSettings =
			subscribeUpdateEditorSettings( ( { ...editorSettings } ) => {
				updateEditorSettings( this.getThemeColors( editorSettings ) );
			} );

		this.subscriptionParentUpdateCapabilities = subscribeUpdateCapabilities(
			( payload ) => {
				this.updateCapabilitiesAction( payload );
			}
		);

		this.subscriptionParentShowNotice = subscribeShowNotice(
			( payload ) => {
				this.props.createSuccessNotice( payload.message );
			}
		);

		this.subscriptionParentShowEditorHelp = subscribeShowEditorHelp( () => {
			this.setState( { isHelpVisible: true } );
		} );

		this.hardwareBackPressListener = BackHandler.addEventListener(
			'hardwareBackPress',
			this.onHardwareBackPress
		);

		this.subscriptionOnContentUpdate = subscribeToContentUpdate(
			( data ) => {
				this.onContentUpdate( data );
			}
		);

		// Request current block impressions from native app.
		requestBlockTypeImpressions( ( storedImpressions ) => {
			const impressions = { ...NEW_BLOCK_TYPES, ...storedImpressions };

			// Persist impressions to JavaScript store.
			updateBlockEditorSettings( { impressions } );

			// Persist impressions to native store if they do not include latest
			// `NEW_BLOCK_TYPES` configuration.
			const storedImpressionKeys = Object.keys( storedImpressions );
			const storedImpressionsCurrent = Object.keys(
				NEW_BLOCK_TYPES
			).every( ( newKey ) => storedImpressionKeys.includes( newKey ) );
			if ( ! storedImpressionsCurrent ) {
				setBlockTypeImpressions( impressions );
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

		if ( this.subscriptionParentReplaceBlock ) {
			this.subscriptionParentReplaceBlock.remove();
		}

		if ( this.subscriptionParentMediaAppend ) {
			this.subscriptionParentMediaAppend.remove();
		}

		if ( this.subscriptionParentUpdateEditorSettings ) {
			this.subscriptionParentUpdateEditorSettings.remove();
		}

		if ( this.subscriptionParentUpdateCapabilities ) {
			this.subscriptionParentUpdateCapabilities.remove();
		}

		if ( this.subscriptionParentShowNotice ) {
			this.subscriptionParentShowNotice.remove();
		}

		if ( this.subscriptionParentShowEditorHelp ) {
			this.subscriptionParentShowEditorHelp.remove();
		}

		if ( this.hardwareBackPressListener ) {
			this.hardwareBackPressListener.remove();
		}

		if ( this.subscriptionOnContentUpdate ) {
			this.subscriptionOnContentUpdate.remove();
		}
	}

	getThemeColors( { rawStyles, rawFeatures } ) {
		const { defaultEditorColors, defaultEditorGradients } = this.props;

		if ( rawStyles && rawFeatures ) {
			return getGlobalStyles( rawStyles, rawFeatures );
		}

		return getColorsAndGradients(
			defaultEditorColors,
			defaultEditorGradients,
			rawFeatures
		);
	}

	componentDidUpdate( prevProps ) {
		if ( ! prevProps.isReady && this.props.isReady ) {
			const blocks = this.props.blocks;
			const isUnsupportedBlock = ( { name } ) =>
				name === getUnregisteredTypeHandlerName();
			const unsupportedBlockNames = blocks
				.filter( isUnsupportedBlock )
				.map( ( block ) => block.attributes.originalName );
			RNReactNativeGutenbergBridge.editorDidMount(
				unsupportedBlockNames
			);
		}
	}

	onHardwareBackPress() {
		const { clearSelectedBlock, selectedBlockIndex } = this.props;

		if ( selectedBlockIndex !== -1 ) {
			clearSelectedBlock();
			return true;
		}
		return false;
	}

	onContentUpdate( { content: rawContent } ) {
		const {
			editTitle,
			onClearPostTitleSelection,
			onInsertBlockAfter: onInsertBlocks,
			title,
		} = this.props;
		const content = pasteHandler( {
			plainText: rawContent,
		} );

		insertContentWithTitle( title, content, editTitle, onInsertBlocks );
		onClearPostTitleSelection();
	}

	serializeToNativeAction() {
		const title = this.props.title;
		let html;

		if ( this.props.mode === 'text' ) {
			// The HTMLTextInput component does not update the store when user is doing changes
			// Let's request the HTML from the component's state directly.
			html = applyFilters( 'native.persist-html' );
		} else {
			html = serialize( this.props.blocks );
		}

		const hasChanges =
			title !== this.post.title.raw || html !== this.post.content.raw;

		// Variable to store the content structure metrics.
		const contentInfo = {};
		contentInfo.characterCount = wordCount(
			html,
			'characters_including_spaces'
		);
		contentInfo.wordCount = wordCount( html, 'words' );
		contentInfo.paragraphCount = this.props.paragraphCount;
		contentInfo.blockCount = this.props.blockCount;
		RNReactNativeGutenbergBridge.provideToNative_Html(
			html,
			title,
			hasChanges,
			contentInfo
		);

		if ( hasChanges ) {
			this.post.title.raw = title;
			this.post.content.raw = html;
		}
	}

	updateHtmlAction( html ) {
		const parsed = parse( html );
		this.props.resetEditorBlocksWithoutUndoLevel( parsed );
	}

	replaceBlockAction( html, blockClientId ) {
		const parsed = parse( html );
		this.props.replaceBlock( blockClientId, parsed );
	}

	toggleMode() {
		const { mode, switchMode } = this.props;
		// Refresh html content first.
		this.serializeToNativeAction();
		switchMode( mode === 'visual' ? 'text' : 'visual' );
	}

	updateCapabilitiesAction( capabilities ) {
		this.props.updateEditorSettings( { capabilities } );
	}

	render() {
		const { children, post, capabilities, settings, ...props } = this.props;
		const editorSettings = this.getEditorSettings( settings, capabilities );

		return (
			<>
				<EditorProvider
					post={ this.post }
					settings={ editorSettings }
					{ ...props }
				>
					<SafeAreaProvider>{ children }</SafeAreaProvider>
				</EditorProvider>
				<EditorHelpTopics
					isVisible={ this.state.isHelpVisible }
					onClose={ () => this.setState( { isHelpVisible: false } ) }
					close={ () => this.setState( { isHelpVisible: false } ) }
					showSupport={ capabilities?.supportSection === true }
				/>
			</>
		);
	}
}

const ComposedNativeProvider = compose( [
	withSelect( ( select ) => {
		const {
			__unstableIsEditorReady: isEditorReady,
			getEditorBlocks,
			getEditedPostAttribute,
			getEditedPostContent,
			getEditorSettings,
			getEditorMode,
		} = select( editorStore );

		const { getBlockIndex, getSelectedBlockClientId, getGlobalBlockCount } =
			select( blockEditorStore );

		const settings = getEditorSettings();
		const defaultEditorColors = settings?.colors ?? [];
		const defaultEditorGradients = settings?.gradients ?? [];

		const selectedBlockClientId = getSelectedBlockClientId();
		return {
			mode: getEditorMode(),
			isReady: isEditorReady(),
			blocks: getEditorBlocks(),
			title: getEditedPostAttribute( 'title' ),
			getEditedPostContent,
			defaultEditorColors,
			defaultEditorGradients,
			selectedBlockIndex: getBlockIndex( selectedBlockClientId ),
			blockCount: getGlobalBlockCount(),
			paragraphCount: getGlobalBlockCount( 'core/paragraph' ),
		};
	} ),
	withDispatch( ( dispatch ) => {
		const {
			editPost,
			resetEditorBlocks,
			updateEditorSettings,
			switchEditorMode,
			togglePostTitleSelection,
		} = dispatch( editorStore );
		const {
			clearSelectedBlock,
			updateSettings,
			insertBlock,
			insertBlocks,
			replaceBlock,
		} = dispatch( blockEditorStore );
		const { addEntities, receiveEntityRecords } = dispatch( coreStore );
		const { createSuccessNotice, createErrorNotice } =
			dispatch( noticesStore );

		return {
			updateBlockEditorSettings: updateSettings,
			updateEditorSettings,
			addEntities,
			insertBlock,
			insertBlocks,
			createSuccessNotice,
			createErrorNotice,
			clearSelectedBlock,
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
			onInsertBlockAfter( blocks ) {
				insertBlocks( blocks, undefined, undefined, false );
			},
			onClearPostTitleSelection() {
				togglePostTitleSelection( false );
			},
			replaceBlock,
		};
	} ),
] )( NativeEditorProvider );

export default ComposedNativeProvider;
export { ComposedNativeProvider as ExperimentalEditorProvider };

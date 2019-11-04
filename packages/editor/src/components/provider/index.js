/**
 * External dependencies
 */
import { map, pick, defaultTo, differenceBy, isEqual, noop } from 'lodash';
import memize from 'memize';

/**
 * WordPress dependencies
 */
import { compose } from '@wordpress/compose';
import { Component } from '@wordpress/element';
import { withDispatch, withSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { EntityProvider } from '@wordpress/core-data';
import { BlockEditorProvider, transformStyles } from '@wordpress/block-editor';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import { decodeEntities } from '@wordpress/html-entities';
import { unregisterBlockType } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import withRegistryProvider from './with-registry-provider';
import { mediaUpload } from '../../utils';
import ReusableBlocksButtons from '../reusable-blocks-buttons';
import ConvertToGroupButtons from '../convert-to-group-buttons';
import InserterMenuDownloadableBlocksPanel from '../inserter-menu-downloadable-blocks-panel';

const fetchLinkSuggestions = async ( search ) => {
	const posts = await apiFetch( {
		path: addQueryArgs( '/wp/v2/search', {
			search,
			per_page: 20,
			type: 'post',
		} ),
	} );

	return map( posts, ( post ) => ( {
		id: post.id,
		url: post.url,
		title: decodeEntities( post.title ) || __( '(no title)' ),
	} ) );
};

const UNINSTALL_ERROR_NOTICE_ID = 'block-uninstall-error';

class EditorProvider extends Component {
	constructor( props ) {
		super( ...arguments );

		this.getBlockEditorSettings = memize( this.getBlockEditorSettings, {
			maxSize: 1,
		} );

		// Assume that we don't need to initialize in the case of an error recovery.
		if ( props.recovery ) {
			return;
		}

		props.updatePostLock( props.settings.postLock );
		props.setupEditor( props.post, props.initialEdits, props.settings.template );

		if ( props.settings.autosave ) {
			props.createWarningNotice(
				__( 'There is an autosave of this post that is more recent than the version below.' ),
				{
					id: 'autosave-exists',
					actions: [
						{
							label: __( 'View the autosave' ),
							url: props.settings.autosave.editLink,
						},
					],
				}
			);
		}
	}

	getBlockEditorSettings(
		settings,
		reusableBlocks,
		hasUploadPermissions,
		canUserUseUnfilteredHTML
	) {
		return {
			...pick( settings, [
				'alignWide',
				'allowedBlockTypes',
				'__experimentalPreferredStyleVariations',
				'availableLegacyWidgets',
				'bodyPlaceholder',
				'codeEditingEnabled',
				'colors',
				'disableCustomColors',
				'disableCustomFontSizes',
				'focusMode',
				'fontSizes',
				'hasFixedToolbar',
				'hasPermissionsToManageWidgets',
				'imageSizes',
				'isRTL',
				'maxWidth',
				'styles',
				'template',
				'templateLock',
				'titlePlaceholder',
				'onUpdateDefaultBlockStyles',
				'__experimentalEnableLegacyWidgetBlock',
				'__experimentalEnableMenuBlock',
				'__experimentalBlockDirectory',
				'showInserterHelpPanel',
			] ),
			__experimentalReusableBlocks: reusableBlocks,
			__experimentalMediaUpload: hasUploadPermissions ? mediaUpload : undefined,
			__experimentalFetchLinkSuggestions: fetchLinkSuggestions,
			__experimentalCanUserUseUnfilteredHTML: canUserUseUnfilteredHTML,
		};
	}

	componentDidMount() {
		this.props.updateEditorSettings( this.props.settings );

		if ( ! this.props.settings.styles ) {
			return;
		}

		const updatedStyles = transformStyles( this.props.settings.styles, '.editor-styles-wrapper' );

		map( updatedStyles, ( updatedCSS ) => {
			if ( updatedCSS ) {
				const node = document.createElement( 'style' );
				node.innerHTML = updatedCSS;
				document.body.appendChild( node );
			}
		} );
	}

	componentDidUpdate( prevProps ) {
		if ( this.props.settings !== prevProps.settings ) {
			this.props.updateEditorSettings( this.props.settings );
		}

		// When a block is installed from the inserter and is unused,
		// it is removed when saving the post.
		// Todo: move this to the edit-post package into a separate component.
		if ( ! isEqual( this.props.downloadableBlocksToUninstall, prevProps.downloadableBlocksToUninstall ) ) {
			this.props.downloadableBlocksToUninstall.forEach( ( blockType ) => {
				this.props.uninstallBlock( blockType, noop, () => {
					this.props.createWarningNotice(
						__( 'Block previews can\'t uninstall.' ), {
							id: UNINSTALL_ERROR_NOTICE_ID,
						} );
				} );
				unregisterBlockType( blockType.name );
			} );
		}
	}

	componentWillUnmount() {
		this.props.tearDownEditor();
	}

	render() {
		const {
			canUserUseUnfilteredHTML,
			children,
			post,
			blocks,
			resetEditorBlocks,
			isReady,
			settings,
			reusableBlocks,
			resetEditorBlocksWithoutUndoLevel,
			hasUploadPermissions,
		} = this.props;

		if ( ! isReady ) {
			return null;
		}

		const editorSettings = this.getBlockEditorSettings(
			settings,
			reusableBlocks,
			hasUploadPermissions,
			canUserUseUnfilteredHTML,
		);

		return (
			<EntityProvider kind="postType" type={ post.type } id={ post.id }>
				<BlockEditorProvider
					value={ blocks }
					onInput={ resetEditorBlocksWithoutUndoLevel }
					onChange={ resetEditorBlocks }
					settings={ editorSettings }
					useSubRegistry={ false }
				>
					{ children }
					<ReusableBlocksButtons />
					<ConvertToGroupButtons />
					{ editorSettings.__experimentalBlockDirectory && <InserterMenuDownloadableBlocksPanel /> }
				</BlockEditorProvider>
			</EntityProvider>
		);
	}
}

export default compose( [
	withRegistryProvider,
	withSelect( ( select ) => {
		const {
			canUserUseUnfilteredHTML,
			__unstableIsEditorReady: isEditorReady,
			getEditorBlocks,
			__experimentalGetReusableBlocks,
		} = select( 'core/editor' );
		const { canUser } = select( 'core' );
		const { getInstalledBlockTypes } = select( 'core/block-directory' );
		const { getBlocks } = select( 'core/block-editor' );

		const downloadableBlocksToUninstall = differenceBy( getInstalledBlockTypes(), getBlocks(), 'name' );

		return {
			canUserUseUnfilteredHTML: canUserUseUnfilteredHTML(),
			isReady: isEditorReady(),
			blocks: getEditorBlocks(),
			reusableBlocks: __experimentalGetReusableBlocks(),
			hasUploadPermissions: defaultTo( canUser( 'create', 'media' ), true ),
			downloadableBlocksToUninstall,
		};
	} ),
	withDispatch( ( dispatch ) => {
		const {
			setupEditor,
			updatePostLock,
			resetEditorBlocks,
			updateEditorSettings,
			__experimentalTearDownEditor,
		} = dispatch( 'core/editor' );
		const { createWarningNotice } = dispatch( 'core/notices' );
		const { uninstallBlock } = dispatch( 'core/block-directory' );

		return {
			setupEditor,
			updatePostLock,
			createWarningNotice,
			resetEditorBlocks,
			updateEditorSettings,
			resetEditorBlocksWithoutUndoLevel( blocks ) {
				resetEditorBlocks( blocks, {
					__unstableShouldCreateUndoLevel: false,
				} );
			},
			tearDownEditor: __experimentalTearDownEditor,
			uninstallBlock,
		};
	} ),
] )( EditorProvider );

/**
 * External dependencies
 */
import { map, pick, defaultTo } from 'lodash';
import memize from 'memize';

/**
 * WordPress dependencies
 */
import { compose } from '@wordpress/compose';
import { Component } from '@wordpress/element';
import { withDispatch, withSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import {
	transformStyles,
	InnerBlocks,
	BlockEditorProvider,
} from '@wordpress/block-editor';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import { decodeEntities } from '@wordpress/html-entities';

/**
 * Internal dependencies
 */
import withRegistryProvider from './with-registry-provider';
import { mediaUpload } from '../../utils';
import ReusableBlocksButtons from '../reusable-blocks-buttons';
import ConvertToGroupButtons from '../convert-to-group-buttons';

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
				'__experimentalEnableLegacyWidgetBlock',
				'__experimentalEnableMenuBlock',
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
	}

	componentWillUnmount() {
		this.props.tearDownEditor();
	}

	render() {
		const {
			canUserUseUnfilteredHTML,
			children,
			blocks,
			resetEditorBlocks,
			isReady,
			settings,
			reusableBlocks,
			resetEditorBlocksWithoutUndoLevel,
			hasUploadPermissions,
			noBlockEditorStore,
			noInnerBlocks,
		} = this.props;

		if ( ! isReady ) {
			return null;
		}

		// This indicates that this provider is nested in another.
		// When this is the case, we want child blocks to sync to
		// this provider's entity and to the top level's entity, as
		// inner blocks. The `handles` prop of each provider will
		// determine which properties, including the actual serialized
		// content, get synced and persisted, or delegated to a parent provider.
		if ( noBlockEditorStore ) {
			// Handle content and blocks if all attributes are implicitly
			// handled and they are not explicitly not handled, or if they
			// are explicitly handled.
			const innerBlocksProps =
				! noInnerBlocks &&
				settings.handles &&
				( ( settings.handles.all &&
					settings.handles.content !== false &&
					settings.handles.blocks !== false ) ||
					( settings.handles.content && settings.handles.blocks ) ) ?
					{
						blocks,
						resetEditorBlocks,
						resetEditorBlocksWithoutUndoLevel,
					} :
					{};
			return (
				<>
					{ children }
					{ /*
						Inner blocks will use the top level registry's block-editor store,
						but we provide props to sync with this provider's entity. Just
						like how the block-editor store syncs with the top level editor store.
					*/ }
					{ ! noInnerBlocks && <InnerBlocks { ...innerBlocksProps } /> }
				</>
			);
		}

		const editorSettings = this.getBlockEditorSettings(
			settings,
			reusableBlocks,
			hasUploadPermissions,
			canUserUseUnfilteredHTML
		);

		return (
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
			</BlockEditorProvider>
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

		return {
			canUserUseUnfilteredHTML: canUserUseUnfilteredHTML(),
			isReady: isEditorReady(),
			blocks: getEditorBlocks(),
			reusableBlocks: __experimentalGetReusableBlocks(),
			hasUploadPermissions: defaultTo( canUser( 'create', 'media' ), true ),
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
		};
	} ),
] )( EditorProvider );

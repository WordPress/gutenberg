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
import { BlockEditorProvider } from '@wordpress/block-editor';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import { decodeEntities } from '@wordpress/html-entities';

/**
 * Internal dependencies
 */
import transformStyles from '../../editor-styles';
import { mediaUpload } from '../../utils';
import ReusableBlocksButtons from '../reusable-blocks-buttons';

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

	getBlockEditorSettings( settings, meta, onMetaChange, reusableBlocks, hasUploadPermissions ) {
		return {
			...pick( settings, [
				'alignWide',
				'allowedBlockTypes',
				'availableLegacyWidgets',
				'bodyPlaceholder',
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
				'templateLock',
				'titlePlaceholder',
			] ),
			__experimentalMetaSource: {
				value: meta,
				onChange: onMetaChange,
			},
			__experimentalReusableBlocks: reusableBlocks,
			__experimentalMediaUpload: hasUploadPermissions ? mediaUpload : undefined,
			__experimentalFetchLinkSuggestions: fetchLinkSuggestions,
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

	render() {
		const {
			children,
			blocks,
			resetEditorBlocks,
			isReady,
			settings,
			meta,
			onMetaChange,
			reusableBlocks,
			resetEditorBlocksWithoutUndoLevel,
			hasUploadPermissions,
		} = this.props;

		if ( ! isReady ) {
			return null;
		}

		const editorSettings = this.getBlockEditorSettings(
			settings, meta, onMetaChange, reusableBlocks, hasUploadPermissions
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
			__experimentalGetReusableBlocks,
		} = select( 'core/editor' );
		const { canUser } = select( 'core' );

		return {
			isReady: isEditorReady(),
			blocks: getEditorBlocks(),
			meta: getEditedPostAttribute( 'meta' ),
			reusableBlocks: __experimentalGetReusableBlocks(),
			hasUploadPermissions: defaultTo( canUser( 'create', 'media' ), true ),
		};
	} ),
	withDispatch( ( dispatch ) => {
		const {
			setupEditor,
			updatePostLock,
			resetEditorBlocks,
			editPost,
			updateEditorSettings,
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
			onMetaChange( meta ) {
				editPost( { meta } );
			},
		};
	} ),
] )( EditorProvider );

/**
 * External dependencies
 */
import { map, pick, defaultTo, flatten, partialRight } from 'lodash';
import memize from 'memize';

/**
 * WordPress dependencies
 */
import { compose } from '@wordpress/compose';
import { Component } from '@wordpress/element';
import { withDispatch, withSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { EntityProvider } from '@wordpress/core-data';
import {
	BlockEditorProvider,
	BlockContextProvider,
} from '@wordpress/block-editor';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import { decodeEntities } from '@wordpress/html-entities';
import { ReusableBlocksMenuItems } from '@wordpress/reusable-blocks';

/**
 * Internal dependencies
 */
import withRegistryProvider from './with-registry-provider';
import { mediaUpload } from '../../utils';
import ConvertToGroupButtons from '../convert-to-group-buttons';
import serializeBlocks from '../../store/utils/serialize-blocks';

/**
 * Fetches link suggestions from the API. This function is an exact copy of a function found at:
 *
 * packages/edit-navigation/src/index.js
 *
 * It seems like there is no suitable package to import this from. Ideally it would be either part of core-data.
 * Until we refactor it, just copying the code is the simplest solution.
 *
 * @param {string} search
 * @param {Object} [searchArguments]
 * @param {number} [searchArguments.isInitialSuggestions]
 * @param {number} [searchArguments.type]
 * @param {number} [searchArguments.subtype]
 * @param {number} [searchArguments.page]
 * @param {Object} [editorSettings]
 * @param {boolean} [editorSettings.disablePostFormats=false]
 * @return {Promise<Object[]>} List of suggestions
 */

const fetchLinkSuggestions = async (
	search,
	{ isInitialSuggestions, type, subtype, page, perPage: perPageArg } = {},
	{ disablePostFormats = false } = {}
) => {
	const perPage = perPageArg || isInitialSuggestions ? 3 : 20;

	const queries = [];

	if ( ! type || type === 'post' ) {
		queries.push(
			apiFetch( {
				path: addQueryArgs( '/wp/v2/search', {
					search,
					page,
					per_page: perPage,
					type: 'post',
					subtype,
				} ),
			} ).catch( () => [] ) // fail by returning no results
		);
	}

	if ( ! type || type === 'term' ) {
		queries.push(
			apiFetch( {
				path: addQueryArgs( '/wp/v2/search', {
					search,
					page,
					per_page: perPage,
					type: 'term',
					subtype,
				} ),
			} ).catch( () => [] )
		);
	}

	if ( ! disablePostFormats && ( ! type || type === 'post-format' ) ) {
		queries.push(
			apiFetch( {
				path: addQueryArgs( '/wp/v2/search', {
					search,
					page,
					per_page: perPage,
					type: 'post-format',
					subtype,
				} ),
			} ).catch( () => [] )
		);
	}

	return Promise.all( queries ).then( ( results ) => {
		return map(
			flatten( results )
				.filter( ( result ) => !! result.id )
				.slice( 0, perPage ),
			( result ) => ( {
				id: result.id,
				url: result.url,
				title: decodeEntities( result.title ) || __( '(no title)' ),
				type: result.subtype || result.type,
			} )
		);
	} );
};

class EditorProvider extends Component {
	constructor( props ) {
		super( ...arguments );

		this.getBlockEditorSettings = memize( this.getBlockEditorSettings, {
			maxSize: 1,
		} );

		this.getDefaultBlockContext = memize( this.getDefaultBlockContext, {
			maxSize: 1,
		} );

		// Assume that we don't need to initialize in the case of an error recovery.
		if ( props.recovery ) {
			return;
		}

		props.updatePostLock( props.settings.postLock );
		props.setupEditor(
			props.post,
			props.initialEdits,
			props.settings.template
		);

		if ( props.settings.autosave ) {
			props.createWarningNotice(
				__(
					'There is an autosave of this post that is more recent than the version below.'
				),
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
		canUserUseUnfilteredHTML,
		undo,
		shouldInsertAtTheTop
	) {
		return {
			...pick( settings, [
				'__experimentalBlockDirectory',
				'__experimentalBlockPatterns',
				'__experimentalBlockPatternCategories',
				'__experimentalFeatures',
				'__experimentalGlobalStylesUserEntityId',
				'__experimentalGlobalStylesBaseStyles',
				'__experimentalPreferredStyleVariations',
				'__experimentalSetIsInserterOpened',
				'alignWide',
				'allowedBlockTypes',
				'availableLegacyWidgets',
				'bodyPlaceholder',
				'codeEditingEnabled',
				'colors',
				'disableCustomColors',
				'disableCustomFontSizes',
				'disableCustomGradients',
				'enableCustomUnits',
				'enableCustomLineHeight',
				'focusMode',
				'fontSizes',
				'gradients',
				'hasFixedToolbar',
				'hasReducedUI',
				'imageEditing',
				'imageSizes',
				'imageDimensions',
				'isRTL',
				'keepCaretInsideBlock',
				'maxWidth',
				'onUpdateDefaultBlockStyles',
				'styles',
				'template',
				'templateLock',
				'titlePlaceholder',
			] ),
			mediaUpload: hasUploadPermissions ? mediaUpload : undefined,
			__experimentalReusableBlocks: reusableBlocks,
			__experimentalFetchLinkSuggestions: partialRight(
				fetchLinkSuggestions,
				settings
			),
			__experimentalCanUserUseUnfilteredHTML: canUserUseUnfilteredHTML,
			__experimentalUndo: undo,
			__experimentalShouldInsertAtTheTop: shouldInsertAtTheTop,
		};
	}

	getDefaultBlockContext( postId, postType ) {
		// To avoid infinite loops, the template CPT shouldn't provide itself as a post content.
		if ( postType === 'wp_template' ) {
			return {};
		}
		return { postId, postType };
	}

	componentDidMount() {
		this.props.updateEditorSettings( this.props.settings );
	}

	componentDidUpdate( prevProps ) {
		if ( this.props.settings !== prevProps.settings ) {
			this.props.updateEditorSettings( this.props.settings );
		}
		if (
			this.props.__unstableTemplate &&
			this.props.__unstableTemplate.id !==
				prevProps.__unstableTemplate?.id
		) {
			this.props.setupTemplate( this.props.__unstableTemplate );
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
			selectionStart,
			selectionEnd,
			isReady,
			settings,
			reusableBlocks,
			resetEditorBlocksWithoutUndoLevel,
			hasUploadPermissions,
			isPostTitleSelected,
			undo,
		} = this.props;

		if ( ! isReady ) {
			return null;
		}

		const editorSettings = this.getBlockEditorSettings(
			settings,
			reusableBlocks,
			hasUploadPermissions,
			canUserUseUnfilteredHTML,
			undo,
			isPostTitleSelected
		);

		const defaultBlockContext = this.getDefaultBlockContext(
			post.id,
			post.type
		);

		return (
			<EntityProvider kind="root" type="site">
				<EntityProvider
					kind="postType"
					type={ post.type }
					id={ post.id }
				>
					<BlockContextProvider value={ defaultBlockContext }>
						<BlockEditorProvider
							value={ blocks }
							onInput={ resetEditorBlocksWithoutUndoLevel }
							onChange={ resetEditorBlocks }
							selectionStart={ selectionStart }
							selectionEnd={ selectionEnd }
							settings={ editorSettings }
							useSubRegistry={ false }
						>
							{ children }
							<ReusableBlocksMenuItems />
							<ConvertToGroupButtons />
						</BlockEditorProvider>
					</BlockContextProvider>
				</EntityProvider>
			</EntityProvider>
		);
	}
}

export default compose( [
	withRegistryProvider,
	withSelect( ( select, { __unstableTemplate, post } ) => {
		const {
			canUserUseUnfilteredHTML,
			__unstableIsEditorReady: isEditorReady,
			getEditorSelectionStart,
			getEditorSelectionEnd,
			isPostTitleSelected,
		} = select( 'core/editor' );
		const { canUser, getEditedEntityRecord } = select( 'core' );

		const { id, type } = __unstableTemplate ?? post;
		return {
			canUserUseUnfilteredHTML: canUserUseUnfilteredHTML(),
			isReady: isEditorReady(),
			blocks: getEditedEntityRecord( 'postType', type, id ).blocks,
			selectionStart: getEditorSelectionStart(),
			selectionEnd: getEditorSelectionEnd(),
			reusableBlocks: select( 'core' ).getEntityRecords(
				'postType',
				'wp_block',
				{ per_page: -1 }
			),
			hasUploadPermissions: defaultTo(
				canUser( 'create', 'media' ),
				true
			),
			// This selector is only defined on mobile.
			isPostTitleSelected: isPostTitleSelected && isPostTitleSelected(),
		};
	} ),
	withDispatch( ( dispatch, props ) => {
		const {
			setupEditor,
			updatePostLock,
			updateEditorSettings,
			__experimentalTearDownEditor,
			undo,
			__unstableSetupTemplate,
		} = dispatch( 'core/editor' );
		const { createWarningNotice } = dispatch( 'core/notices' );
		const { __unstableCreateUndoLevel, editEntityRecord } = dispatch(
			'core'
		);

		// This is not breaking the withDispatch rule.
		// eslint-disable-next-line no-restricted-syntax
		function updateBlocks( blocks, options ) {
			const {
				post,
				__unstableTemplate: template,
				blocks: currentBlocks,
			} = props;
			const { id, type } = template ?? post;
			const {
				__unstableShouldCreateUndoLevel,
				selectionStart,
				selectionEnd,
			} = options;
			const edits = { blocks, selectionStart, selectionEnd };

			if ( __unstableShouldCreateUndoLevel !== false ) {
				const noChange = currentBlocks === edits.blocks;
				if ( noChange ) {
					return __unstableCreateUndoLevel( 'postType', type, id );
				}

				// We create a new function here on every persistent edit
				// to make sure the edit makes the post dirty and creates
				// a new undo level.
				edits.content = ( { blocks: blocksForSerialization = [] } ) =>
					serializeBlocks( blocksForSerialization );
			}

			editEntityRecord( 'postType', type, id, edits );
		}

		return {
			setupEditor,
			updatePostLock,
			createWarningNotice,
			resetEditorBlocks: updateBlocks,
			updateEditorSettings,
			resetEditorBlocksWithoutUndoLevel( blocks, options ) {
				updateBlocks( blocks, {
					...options,
					__unstableShouldCreateUndoLevel: false,
				} );
			},
			tearDownEditor: __experimentalTearDownEditor,
			setupTemplate: __unstableSetupTemplate,
			undo,
		};
	} ),
] )( EditorProvider );

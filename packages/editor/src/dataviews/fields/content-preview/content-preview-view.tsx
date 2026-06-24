/**
 * WordPress dependencies
 */
import loadAssets, { getResolvedAssetsHtml } from '@wordpress/asset-loader';
import { __ } from '@wordpress/i18n';
import {
	// @ts-ignore
	BlockPreview,
	// @ts-ignore
} from '@wordpress/block-editor';
import { parse } from '@wordpress/blocks';
import type { BasePost } from '@wordpress/fields';
import { useSelect } from '@wordpress/data';
import { useEffect, useMemo, useState } from '@wordpress/element';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { EditorProvider } from '../../../components/provider';
import { useStyle } from '../../../components/global-styles';
import { useGlobalStylesOutput } from '../../../hooks/use-global-styles-output';
import { unlock } from '../../../lock-unlock';
// @ts-ignore
import { store as editorStore } from '../../../store';

const UntypedBlockPreview = BlockPreview as any;
const AsyncBlockPreview = UntypedBlockPreview.Async;

type EditorSettings = Record< string, unknown > & {
	styles?: Array< {
		isGlobalStyles?: boolean;
		[ key: string ]: unknown;
	} >;
};

type EditorAssets = Record< string, any > & {
	scripts?: Record< string, any >;
	inline_scripts?: Record< string, any >;
	styles?: Record< string, any >;
	inline_styles?: Record< string, any >;
	html_templates?: any[];
	script_modules?: Record< string, any >;
};

let loadEditorPreviewAssetsPromise: Promise< void > | undefined;

function loadEditorPreviewAssets( editorAssets: EditorAssets ) {
	if ( ! loadEditorPreviewAssetsPromise ) {
		loadEditorPreviewAssetsPromise = loadAssets(
			editorAssets.scripts || {},
			editorAssets.inline_scripts || { before: {}, after: {} },
			editorAssets.styles || {},
			editorAssets.inline_styles || { before: {}, after: {} },
			editorAssets.html_templates || [],
			editorAssets.script_modules || {}
		);
	}

	return loadEditorPreviewAssetsPromise;
}

function getResolvedAssets( editorAssets: EditorAssets | null ) {
	if ( ! editorAssets ) {
		return undefined;
	}

	return getResolvedAssetsHtml(
		editorAssets.scripts || {},
		editorAssets.inline_scripts || { before: {}, after: {} },
		editorAssets.styles || {},
		editorAssets.inline_styles || { before: {}, after: {} }
	);
}

function useEditorPreviewAssets() {
	const editorAssets = useSelect( ( select ) => {
		return unlock( select( coreStore ) ).getEditorAssets();
	}, [] ) as EditorAssets | null;
	const [ assetsLoaded, setAssetsLoaded ] = useState( false );
	const resolvedAssets = useMemo(
		() => getResolvedAssets( editorAssets ),
		[ editorAssets ]
	);

	useEffect( () => {
		if ( ! editorAssets || assetsLoaded ) {
			return;
		}

		loadEditorPreviewAssets( editorAssets )
			.then( () => setAssetsLoaded( true ) )
			.catch( ( error: Error ) => {
				// eslint-disable-next-line no-console
				console.error( 'Failed to load editor preview assets:', error );
			} );
	}, [ assetsLoaded, editorAssets ] );

	return {
		isReady: !! editorAssets && assetsLoaded,
		resolvedAssets,
	};
}

function PostPreviewContainer( {
	template,
	post,
}: {
	template: any;
	post: any;
} ) {
	const backgroundColor = useStyle( 'color.background' ) || 'white';
	const blocks = useMemo( () => {
		const content = template?.content?.raw || post?.content?.raw;

		if ( ! content ) {
			return [];
		}

		return parse( content );
	}, [ post?.content?.raw, template?.content?.raw ] );
	const isEmpty = ! blocks?.length;
	return (
		<div
			className="editor-fields-content-preview"
			style={ {
				backgroundColor,
			} }
		>
			{ isEmpty && (
				<span className="editor-fields-content-preview__empty">
					{ __( 'Empty content' ) }
				</span>
			) }
			{ ! isEmpty && (
				<AsyncBlockPreview>
					<UntypedBlockPreview blocks={ blocks } />
				</AsyncBlockPreview>
			) }
		</div>
	);
}

export default function PostPreviewView( { item }: { item: BasePost } ) {
	const { isReady: assetsReady, resolvedAssets } = useEditorPreviewAssets();
	const [ globalStyles, globalStyleSettings ] = useGlobalStylesOutput();
	const { settings, template } = useSelect(
		( select ) => {
			const { canUser, getPostType, getTemplateId, getEntityRecord } =
				unlock( select( coreStore ) );
			const canViewTemplate = canUser( 'read', {
				kind: 'postType',
				name: 'wp_template',
			} );
			const _settings = select(
				editorStore
			).getEditorSettings() as EditorSettings;
			const isViewable = getPostType( item.type )?.viewable ?? false;

			const templateId =
				isViewable && canViewTemplate
					? getTemplateId( item.type, item.id )
					: null;
			return {
				settings: _settings,
				template: templateId
					? getEntityRecord( 'postType', 'wp_template', templateId )
					: undefined,
			};
		},
		[ item.type, item.id ]
	);

	const previewSettings = useMemo( () => {
		const nonGlobalStyles = ( settings?.styles ?? [] ).filter(
			( style ) => ! style.isGlobalStyles
		);

		return {
			...( settings ?? {} ),
			__unstableResolvedAssets:
				resolvedAssets ?? settings?.__unstableResolvedAssets,
			isPreviewMode: true,
			styles: [ ...nonGlobalStyles, ...globalStyles ],
			__experimentalFeatures: globalStyleSettings,
		};
	}, [ globalStyleSettings, globalStyles, resolvedAssets, settings ] );

	if ( ! assetsReady ) {
		return (
			<div className="editor-fields-content-preview">
				<span className="editor-fields-content-preview__empty">
					{ __( 'Loading preview' ) }
				</span>
			</div>
		);
	}

	// Wrap everything in a block editor provider to ensure 'styles' that are needed
	// for the previews are synced between the site editor store and the block editor store.
	// Additionally we need to have the `__experimentalBlockPatterns` setting in order to
	// render patterns inside the previews.
	// TODO: Same approach is used in the patterns list and it becomes obvious that some of
	// the block editor settings are needed in context where we don't have the block editor.
	// Explore how we can solve this in a better way.
	return (
		<EditorProvider
			key="assets-ready"
			post={ item }
			settings={ previewSettings }
			__unstableTemplate={ template }
		>
			<PostPreviewContainer template={ template } post={ item } />
		</EditorProvider>
	);
}

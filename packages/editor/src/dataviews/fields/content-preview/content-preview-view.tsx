/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	// @ts-ignore
	BlockPreview,
	// @ts-ignore
} from '@wordpress/block-editor';
import { parse } from '@wordpress/blocks';
import type { BasePost } from '@wordpress/fields';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
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
				<BlockPreview.Async>
					<BlockPreview blocks={ blocks } />
				</BlockPreview.Async>
			) }
		</div>
	);
}

export default function PostPreviewView( { item }: { item: BasePost } ) {
	const [ globalStyles, globalStyleSettings ] = useGlobalStylesOutput();
	const { settings, template } = useSelect(
		( select ) => {
			const { canUser, getPostType, getTemplateId, getEntityRecord } =
				unlock( select( coreStore ) );
			const canViewTemplate = canUser( 'read', {
				kind: 'postType',
				name: 'wp_template',
			} );
			const _settings = select( editorStore ).getEditorSettings();
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
		const nonGlobalStyles = Object.values( settings?.styles ?? [] ).filter(
			( style: any ) => ! style.isGlobalStyles
		);

		return {
			...( settings ?? {} ),
			styles: [ ...nonGlobalStyles, ...globalStyles ],
			__experimentalFeatures: globalStyleSettings,
		};
	}, [ globalStyleSettings, globalStyles, settings ] );

	// Wrap everything in a block editor provider to ensure 'styles' that are needed
	// for the previews are synced between the site editor store and the block editor store.
	// Additionally we need to have the `__experimentalBlockPatterns` setting in order to
	// render patterns inside the previews.
	// TODO: Same approach is used in the patterns list and it becomes obvious that some of
	// the block editor settings are needed in context where we don't have the block editor.
	// Explore how we can solve this in a better way.
	return (
		<EditorProvider
			post={ item }
			settings={ previewSettings }
			__unstableTemplate={ template }
		>
			<PostPreviewContainer template={ template } post={ item } />
		</EditorProvider>
	);
}

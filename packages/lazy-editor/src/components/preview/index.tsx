/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useId, useMemo } from '@wordpress/element';
// @ts-expect-error Block Editor not fully typed yet.
import { BlockPreview, BlockEditorProvider } from '@wordpress/block-editor';
import { privateApis as editorPrivateApis } from '@wordpress/editor';
// @ts-expect-error Blocks not fully typed yet.
import { parse } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import './style.scss';
import { unlock } from '../../lock-unlock';
import { useEditorAssets } from '../../hooks/use-editor-assets';
import { useEditorSettings } from '../../hooks/use-editor-settings';
import { useStylesId } from '../../hooks/use-styles-id';

const { useStyle } = unlock( editorPrivateApis );

function PreviewContent( {
	item,
	description,
}: {
	item: { blocks?: any[]; content: { raw: string } };
	description: string;
} ) {
	const descriptionId = useId();
	const backgroundColor = useStyle( 'color.background' );
	const blocks = useMemo( () => {
		return (
			item.blocks ??
			parse( item.content.raw, {
				__unstableSkipMigrationLogs: true,
			} )
		);
	}, [ item?.content?.raw, item.blocks ] );
	const isEmpty = ! blocks?.length;

	return (
		<div
			className="lazy-editor-block-preview__container"
			style={ { backgroundColor } }
			aria-describedby={ !! description ? descriptionId : undefined }
		>
			{ isEmpty && __( 'Empty template part' ) }
			{ ! isEmpty && (
				<BlockPreview.Async>
					<BlockPreview blocks={ blocks } />
				</BlockPreview.Async>
			) }
			{ !! description && (
				<div hidden id={ descriptionId }>
					{ description }
				</div>
			) }
		</div>
	);
}

export function Preview( {
	item,
	description,
}: {
	item: { blocks?: any[]; content: { raw: string } };
	description: string;
} ) {
	// Resolve styles ID from template
	const stylesId = useStylesId();

	// Load editor settings and assets
	const { isReady: settingsReady, editorSettings } = useEditorSettings( {
		stylesId,
	} );
	const { isReady: assetsReady } = useEditorAssets();
	const finalSettings = useMemo(
		() => ( {
			...editorSettings,
			isPreviewMode: true,
		} ),
		[ editorSettings ]
	);
	if ( ! settingsReady || ! assetsReady ) {
		return null;
	}
	return (
		<BlockEditorProvider settings={ finalSettings }>
			<PreviewContent item={ item } description={ description } />
		</BlockEditorProvider>
	);
}

/**
 * External dependencies
 */
import type { ReactNode } from 'react';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useId, useMemo } from '@wordpress/element';
// @ts-ignore No exported types.
import { BlockPreview, BlockEditorProvider } from '@wordpress/block-editor';
import { privateApis as editorPrivateApis } from '@wordpress/editor';
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
const UntypedBlockPreview = BlockPreview as any;
const AsyncBlockPreview = UntypedBlockPreview.Async;

function PreviewContent( {
	blocks,
	content,
	description,
	placeholder,
	viewportWidth,
}: {
	blocks?: any[];
	content?: string;
	description: string;
	placeholder?: ReactNode;
	viewportWidth?: number;
} ) {
	const descriptionId = useId();
	const backgroundColor = useStyle( 'color.background' );
	const actualBlocks = useMemo( () => {
		return (
			blocks ??
			parse( content!, {
				__unstableSkipMigrationLogs: true,
			} )
		);
	}, [ content, blocks ] );
	const isEmpty = ! actualBlocks?.length;

	return (
		<div
			className="lazy-editor-block-preview__container"
			style={ { backgroundColor } }
			aria-describedby={ !! description ? descriptionId : undefined }
		>
			{ isEmpty && __( 'Empty.' ) }
			{ ! isEmpty && (
				<AsyncBlockPreview placeholder={ placeholder }>
					<UntypedBlockPreview
						blocks={ actualBlocks }
						viewportWidth={ viewportWidth }
					/>
				</AsyncBlockPreview>
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
	blocks,
	content,
	description,
	placeholder,
	viewportWidth,
}: {
	blocks?: any[];
	content?: string;
	description: string;
	placeholder?: ReactNode;
	viewportWidth?: number;
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
		return placeholder ?? null;
	}
	return (
		<BlockEditorProvider key="assets-ready" settings={ finalSettings }>
			<PreviewContent
				blocks={ blocks }
				content={ content }
				description={ description }
				placeholder={ placeholder }
				viewportWidth={ viewportWidth }
			/>
		</BlockEditorProvider>
	);
}

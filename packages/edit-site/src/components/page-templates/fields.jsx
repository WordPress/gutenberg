import { __ } from '@wordpress/i18n';
import { useMemo } from '@wordpress/element';
import { parse } from '@wordpress/blocks';
import { BlockPreview } from '@wordpress/block-editor';
import {
	EditorProvider,
	privateApis as editorPrivateApis,
} from '@wordpress/editor';
import usePatternSettings from '../page-patterns/use-pattern-settings';
import { unlock } from '../../lock-unlock';

const { useStyle } = unlock( editorPrivateApis );

function PreviewField( { item } ) {
	const settings = usePatternSettings();
	const backgroundColor = useStyle( 'color.background' ) ?? 'white';
	const blocks = useMemo( () => {
		return parse( item.content.raw );
	}, [ item.content.raw ] );

	const isEmpty = ! blocks?.length;
	// Wrap everything in a block editor provider to ensure 'styles' that are needed
	// for the previews are synced between the site editor store and the block editor store.
	// Additionally we need to have the `__experimentalBlockPatterns` setting in order to
	// render patterns inside the previews.
	// TODO: Same approach is used in the patterns list and it becomes obvious that some of
	// the block editor settings are needed in context where we don't have the block editor.
	// Explore how we can solve this in a better way.
	return (
		<EditorProvider post={ item } settings={ settings }>
			<div
				className="page-templates-preview-field"
				style={ { backgroundColor } }
			>
				{ isEmpty && __( 'Empty template' ) }
				{ ! isEmpty && (
					<BlockPreview.Async>
						<BlockPreview blocks={ blocks } />
					</BlockPreview.Async>
				) }
			</div>
		</EditorProvider>
	);
}

export const previewField = {
	label: __( 'Preview' ),
	id: 'preview',
	render: PreviewField,
	enableSorting: false,
};

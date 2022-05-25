/**
 * WordPress dependencies
 */
import { useCallback, useMemo } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { useDispatch } from '@wordpress/data';
import { parse } from '@wordpress/blocks';
import { useAsyncList } from '@wordpress/compose';
import {
	__experimentalBlockPatternsList as BlockPatternsList,
	store as blockEditorStore,
} from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import {
	useAlternativeBlockPatterns,
	useAlternativeTemplateParts,
	useCreateTemplatePartFromBlocks,
} from './utils/hooks';
import { createTemplatePartId } from './utils/create-template-part-id';

export default function TemplatePartSelectionModal( {
	setAttributes,
	onClose,
	templatePartId = null,
	area,
	clientId,
} ) {
	// When the templatePartId is undefined,
	// it means the user is creating a new one from the placeholder.
	const isReplacingTemplatePartContent = !! templatePartId;
	const { templateParts } = useAlternativeTemplateParts(
		area,
		templatePartId
	);
	// We can map template parts to block patters to reuse the BlockPatternsList UI
	const templartPartsAsBlockPatterns = useMemo( () => {
		return templateParts.map( ( templatePart ) => ( {
			name: createTemplatePartId( templatePart.theme, templatePart.slug ),
			title: templatePart.title.rendered,
			blocks: parse( templatePart.content.raw ),
			templatePart,
		} ) );
	}, [ templateParts ] );
	const shownTemplateParts = useAsyncList( templartPartsAsBlockPatterns );
	const { createSuccessNotice } = useDispatch( noticesStore );
	const blockPatterns = useAlternativeBlockPatterns( area, clientId );
	const shownBlockPatterns = useAsyncList( blockPatterns );
	const { replaceInnerBlocks } = useDispatch( blockEditorStore );

	const onTemplatePartSelect = useCallback( ( templatePart ) => {
		setAttributes( {
			slug: templatePart.slug,
			theme: templatePart.theme,
			area: undefined,
		} );
		createSuccessNotice(
			sprintf(
				/* translators: %s: template part title. */
				__( 'Template Part "%s" inserted.' ),
				templatePart.title?.rendered || templatePart.slug
			),
			{
				type: 'snackbar',
			}
		);
		onClose();
	}, [] );

	const createFromBlocks = useCreateTemplatePartFromBlocks(
		area,
		setAttributes
	);

	return (
		<>
			<div className="block-library-template-part__selection-content">
				{ !! templartPartsAsBlockPatterns.length && (
					<div>
						<h2>{ __( 'Existing template parts' ) }</h2>
						<BlockPatternsList
							blockPatterns={ templartPartsAsBlockPatterns }
							shownPatterns={ shownTemplateParts }
							onClickPattern={ ( pattern ) => {
								onTemplatePartSelect( pattern.templatePart );
							} }
						/>
					</div>
				) }

				{ !! blockPatterns.length && (
					<div>
						<h2>{ __( 'Patterns' ) }</h2>
						<BlockPatternsList
							blockPatterns={ blockPatterns }
							shownPatterns={ shownBlockPatterns }
							onClickPattern={ ( pattern, blocks ) => {
								if ( isReplacingTemplatePartContent ) {
									replaceInnerBlocks( clientId, blocks );
								} else {
									createFromBlocks( blocks, pattern.title );
								}

								onClose();
							} }
						/>
					</div>
				) }
			</div>
		</>
	);
}

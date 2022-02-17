/**
 * WordPress dependencies
 */
import { useCallback, useState, useMemo } from '@wordpress/element';
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
import TitleModal from './title-modal';
import {
	useAlternativeBlockPatterns,
	useAlternativeTemplateParts,
	useCreateTemplatePartFromBlocks,
	useTemplatePartArea,
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
	const areaObject = useTemplatePartArea( area );
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
	const [ showTitleModal, setShowTitleModal ] = useState( false );
	const blockPatterns = useAlternativeBlockPatterns( area, clientId );
	const [ selectedBlocks, setSelectedBlocks ] = useState( [] );
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
							onClickPattern={ ( _, blocks ) => {
								if ( isReplacingTemplatePartContent ) {
									replaceInnerBlocks( clientId, blocks );
									onClose();
								} else {
									setSelectedBlocks( blocks );
									setShowTitleModal( true );
								}
							} }
						/>
					</div>
				) }
			</div>

			{ showTitleModal && (
				<TitleModal
					areaLabel={ areaObject.label }
					onClose={ () => setShowTitleModal( false ) }
					onSubmit={ ( title ) => {
						createFromBlocks( selectedBlocks, title );
						onClose();
					} }
				/>
			) }
		</>
	);
}

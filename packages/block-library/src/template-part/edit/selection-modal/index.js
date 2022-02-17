/**
 * External dependencies
 */
import { kebabCase } from 'lodash';

/**
 * WordPress dependencies
 */
import { useCallback, useState, useMemo } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { useDispatch } from '@wordpress/data';
import { parse, serialize } from '@wordpress/blocks';
import { store as coreStore } from '@wordpress/core-data';
import { Button } from '@wordpress/components';
import { useAsyncList } from '@wordpress/compose';
import { __experimentalBlockPatternsList as BlockPatternsList } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import TitleModal from './title-modal';
import {
	useAlternativeBlockPatterns,
	useAlternativeTemplateParts,
} from '../utils/hooks';
import { createTemplatePartId } from '../utils/create-template-part-id';

export default function TemplatePartSelectionModal( {
	setAttributes,
	onClose,
	templatePartId = null,
	area,
	areaLabel,
	clientId,
} ) {
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
	const { saveEntityRecord } = useDispatch( coreStore );
	const [ showTitleModal, setShowTitleModal ] = useState( false );
	const blockPatterns = useAlternativeBlockPatterns( area, clientId );
	const [ selectedBlocks, setSelectedBlocks ] = useState( [] );
	const shownBlockPatterns = useAsyncList( blockPatterns );

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

	const createFromBlocks = async (
		blocks = [],
		title = __( 'Untitled Template Part' )
	) => {
		// If we have `area` set from block attributes, means an exposed
		// block variation was inserted. So add this prop to the template
		// part entity on creation. Afterwards remove `area` value from
		// block attributes.
		const record = {
			title,
			slug: kebabCase( title ),
			content: serialize( blocks ),
			// `area` is filterable on the server and defaults to `UNCATEGORIZED`
			// if provided value is not allowed.
			area,
		};
		const templatePart = await saveEntityRecord(
			'postType',
			'wp_template_part',
			record
		);
		setAttributes( {
			slug: templatePart.slug,
			theme: templatePart.theme,
			area: undefined,
		} );
	};

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
								setSelectedBlocks( blocks );
								setShowTitleModal( true );
							} }
						/>
					</div>
				) }
			</div>

			<div className="block-library-template-part__selection-footer">
				<Button
					isSecondary
					onClick={ () => {
						setSelectedBlocks( [] );
						setShowTitleModal( true );
					} }
				>
					{ __( 'Start blank' ) }
				</Button>
			</div>

			{ showTitleModal && (
				<TitleModal
					areaLabel={ areaLabel }
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

/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import {
	BlockSettingsMenuControls,
	useBlockProps,
	Warning,
	store as blockEditorStore,
	RecursionProvider,
	useHasRecursion,
	InspectorControls,
	__experimentalBlockPatternsList as BlockPatternsList,
} from '@wordpress/block-editor';
import { PanelBody, Spinner, Modal, MenuItem } from '@wordpress/components';
import { useAsyncList } from '@wordpress/compose';
import { __, sprintf } from '@wordpress/i18n';
import { store as coreStore } from '@wordpress/core-data';
import { useState } from '@wordpress/element';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import TemplatePartPlaceholder from './placeholder';
import TemplatePartSelectionModal from './selection-modal';
import { TemplatePartAdvancedControls } from './advanced-controls';
import TemplatePartInnerBlocks from './inner-blocks';
import { createTemplatePartId } from './utils/create-template-part-id';
import { mapTemplatePartToBlockPattern } from './utils/map-template-part-to-block-pattern';
import {
	useAlternativeBlockPatterns,
	useAlternativeTemplateParts,
	useTemplatePartArea,
	useCreateTemplatePartFromBlocks,
} from './utils/hooks';

function ReplaceButton( {
	isEntityAvailable,
	area,
	clientId,
	templatePartId,
	isTemplatePartSelectionOpen,
	setIsTemplatePartSelectionOpen,
} ) {
	const { templateParts } = useAlternativeTemplateParts(
		area,
		templatePartId
	);
	const blockPatterns = useAlternativeBlockPatterns( area, clientId );
	const hasReplacements = !! templateParts.length || !! blockPatterns.length;
	const canReplace =
		isEntityAvailable &&
		hasReplacements &&
		( area === 'header' || area === 'footer' );

	if ( ! canReplace ) {
		return null;
	}

	return (
		<MenuItem
			onClick={ () => {
				setIsTemplatePartSelectionOpen( true );
			} }
			aria-expanded={ isTemplatePartSelectionOpen }
			aria-haspopup="dialog"
		>
			{ __( 'Replace' ) }
		</MenuItem>
	);
}

function TemplatesList( { availableTemplates, onSelect } ) {
	const shownTemplates = useAsyncList( availableTemplates );

	if ( ! availableTemplates ) {
		return null;
	}

	return (
		<BlockPatternsList
			label={ __( 'Templates' ) }
			blockPatterns={ availableTemplates }
			shownPatterns={ shownTemplates }
			onClickPattern={ onSelect }
		/>
	);
}

export default function TemplatePartEdit( {
	attributes,
	setAttributes,
	clientId,
} ) {
	const { createSuccessNotice } = useDispatch( noticesStore );
	const currentTheme = useSelect(
		( select ) => select( coreStore ).getCurrentTheme()?.stylesheet,
		[]
	);
	const { slug, theme = currentTheme, tagName, layout = {} } = attributes;
	const templatePartId = createTemplatePartId( theme, slug );
	const hasAlreadyRendered = useHasRecursion( templatePartId );
	const [ isTemplatePartSelectionOpen, setIsTemplatePartSelectionOpen ] =
		useState( false );

	const { isResolved, hasInnerBlocks, isMissing, area } = useSelect(
		( select ) => {
			const { getEditedEntityRecord, hasFinishedResolution } =
				select( coreStore );
			const { getBlockCount } = select( blockEditorStore );

			const getEntityArgs = [
				'postType',
				'wp_template_part',
				templatePartId,
			];
			const entityRecord = templatePartId
				? getEditedEntityRecord( ...getEntityArgs )
				: null;
			const _area = entityRecord?.area || attributes.area;
			const hasResolvedEntity = templatePartId
				? hasFinishedResolution(
						'getEditedEntityRecord',
						getEntityArgs
				  )
				: false;

			return {
				hasInnerBlocks: getBlockCount( clientId ) > 0,
				isResolved: hasResolvedEntity,
				isMissing:
					hasResolvedEntity &&
					( ! entityRecord ||
						Object.keys( entityRecord ).length === 0 ),
				area: _area,
			};
		},
		[ templatePartId, attributes.area, clientId ]
	);

	const { templateParts } = useAlternativeTemplateParts(
		area,
		templatePartId
	);
	const blockPatterns = useAlternativeBlockPatterns( area, clientId );
	const hasReplacements = !! templateParts.length || !! blockPatterns.length;
	const areaObject = useTemplatePartArea( area );
	const blockProps = useBlockProps();
	const isPlaceholder = ! slug;
	const isEntityAvailable = ! isPlaceholder && ! isMissing && isResolved;
	const TagName = tagName || areaObject.tagName;

	const canReplace =
		isEntityAvailable &&
		hasReplacements &&
		( area === 'header' || area === 'footer' );

	const createFromBlocks = useCreateTemplatePartFromBlocks(
		area,
		setAttributes
	);

	// We don't want to render a missing state if we have any inner blocks.
	// A new template part is automatically created if we have any inner blocks but no entity.
	if (
		! hasInnerBlocks &&
		( ( slug && ! theme ) || ( slug && isMissing ) )
	) {
		return (
			<TagName { ...blockProps }>
				<Warning>
					{ sprintf(
						/* translators: %s: Template part slug */
						__(
							'Template part has been deleted or is unavailable: %s'
						),
						slug
					) }
				</Warning>
			</TagName>
		);
	}

	if ( isEntityAvailable && hasAlreadyRendered ) {
		return (
			<TagName { ...blockProps }>
				<Warning>
					{ __( 'Block cannot be rendered inside itself.' ) }
				</Warning>
			</TagName>
		);
	}

	const partsAsPatterns = templateParts.map( ( templatePart ) =>
		mapTemplatePartToBlockPattern( templatePart )
	);

	const onTemplatePartSelect = ( templatePart ) => {
		setAttributes( {
			slug: templatePart.slug,
			theme: templatePart.theme,
			area: undefined,
		} );
		createSuccessNotice(
			sprintf(
				/* translators: %s: template part title. */
				__( 'Template Part "%s" replaceed.' ),
				templatePart.title?.rendered || templatePart.slug
			),
			{
				type: 'snackbar',
			}
		);
	};

	return (
		<>
			<RecursionProvider uniqueId={ templatePartId }>
				<InspectorControls group="advanced">
					<TemplatePartAdvancedControls
						tagName={ tagName }
						setAttributes={ setAttributes }
						isEntityAvailable={ isEntityAvailable }
						templatePartId={ templatePartId }
						defaultWrapper={ areaObject.tagName }
						hasInnerBlocks={ hasInnerBlocks }
					/>
				</InspectorControls>
				{ isPlaceholder && (
					<TagName { ...blockProps }>
						<TemplatePartPlaceholder
							area={ attributes.area }
							templatePartId={ templatePartId }
							clientId={ clientId }
							setAttributes={ setAttributes }
							onOpenSelectionModal={ () =>
								setIsTemplatePartSelectionOpen( true )
							}
						/>
					</TagName>
				) }
				<BlockSettingsMenuControls>
					{ ( { selectedClientIds } ) => {
						// Only enable for single selection that matches the current block.
						// Ensures menu item doesn't render multiple times.
						if (
							! (
								selectedClientIds.length === 1 &&
								clientId === selectedClientIds[ 0 ]
							)
						) {
							return null;
						}

						return (
							<ReplaceButton
								{ ...{
									isEntityAvailable,
									area,
									clientId,
									templatePartId,
									isTemplatePartSelectionOpen,
									setIsTemplatePartSelectionOpen,
								} }
							/>
						);
					} }
				</BlockSettingsMenuControls>

				{ canReplace &&
					( partsAsPatterns.length > 0 ||
						blockPatterns.length > 0 ) && (
						<InspectorControls>
							<PanelBody title={ __( 'Replace' ) }>
								<TemplatesList
									availableTemplates={ partsAsPatterns }
									onSelect={ ( pattern ) => {
										onTemplatePartSelect(
											pattern.templatePart
										);
									} }
								/>
								<TemplatesList
									availableTemplates={ blockPatterns }
									onSelect={ ( pattern, blocks ) => {
										createFromBlocks(
											blocks,
											pattern.title
										);
									} }
								/>
							</PanelBody>
						</InspectorControls>
					) }

				{ isEntityAvailable && (
					<TemplatePartInnerBlocks
						tagName={ TagName }
						blockProps={ blockProps }
						postId={ templatePartId }
						hasInnerBlocks={ hasInnerBlocks }
						layout={ layout }
					/>
				) }
				{ ! isPlaceholder && ! isResolved && (
					<TagName { ...blockProps }>
						<Spinner />
					</TagName>
				) }
			</RecursionProvider>
			{ isTemplatePartSelectionOpen && (
				<Modal
					overlayClassName="block-editor-template-part__selection-modal"
					title={ sprintf(
						// Translators: %s as template part area title ("Header", "Footer", etc.).
						__( 'Choose a %s' ),
						areaObject.label.toLowerCase()
					) }
					onRequestClose={ () =>
						setIsTemplatePartSelectionOpen( false )
					}
					isFullScreen={ true }
				>
					<TemplatePartSelectionModal
						templatePartId={ templatePartId }
						clientId={ clientId }
						area={ area }
						setAttributes={ setAttributes }
						onClose={ () =>
							setIsTemplatePartSelectionOpen( false )
						}
					/>
				</Modal>
			) }
		</>
	);
}

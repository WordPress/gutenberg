/**
 * External dependencies
 */
import { isEmpty } from 'lodash';

/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';
import {
	BlockSettingsMenuControls,
	BlockTitle,
	useBlockProps,
	Warning,
	store as blockEditorStore,
	__experimentalRecursionProvider as RecursionProvider,
	__experimentalUseHasRecursion as useHasRecursion,
	__experimentalUseBlockOverlayActive as useBlockOverlayActive,
} from '@wordpress/block-editor';
import { Modal, Spinner, MenuItem } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { store as coreStore } from '@wordpress/core-data';
import { useState, createInterpolateElement } from '@wordpress/element';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import TemplatePartPlaceholder from './placeholder';
import TemplatePartSelection from '../components/template-part-selection';
import { TemplatePartAdvancedControls } from './advanced-controls';
import TemplatePartInnerBlocks from './inner-blocks';
import createTemplatePartId from '../utils/create-template-part-id';
import createTemplatePartPostData from '../utils/create-template-part-post-data';
import {
	useAlternativeBlockPatterns,
	useAlternativeTemplateParts,
	useTemplatePartArea,
} from '../utils/hooks';

export default function TemplatePartEdit( {
	attributes,
	setAttributes,
	clientId,
	isSelected,
} ) {
	const { slug, theme, tagName, layout = {} } = attributes;
	const templatePartId = createTemplatePartId( theme, slug );
	const hasAlreadyRendered = useHasRecursion( templatePartId );
	const [ isTemplatePartSelectionOpen, setIsTemplatePartSelectionOpen ] =
		useState( false );

	// Set the postId block attribute if it did not exist,
	// but wait until the inner blocks have loaded to allow
	// new edits to trigger this.
	const { rootClientId, isResolved, innerBlocks, isMissing, area } =
		useSelect(
			( select ) => {
				const { getEditedEntityRecord, hasFinishedResolution } =
					select( coreStore );
				const { getBlocks, getBlockRootClientId } =
					select( blockEditorStore );

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
					rootClientId: getBlockRootClientId( clientId ),
					innerBlocks: getBlocks( clientId ),
					isResolved: hasResolvedEntity,
					isMissing: hasResolvedEntity && isEmpty( entityRecord ),
					area: _area,
				};
			},
			[ templatePartId, clientId ]
		);

	const { saveEntityRecord } = useDispatch( coreStore );
	const { createSuccessNotice } = useDispatch( noticesStore );
	const { replaceInnerBlocks } = useDispatch( blockEditorStore );
	const { templateParts } = useAlternativeTemplateParts(
		area,
		templatePartId
	);
	const blockPatterns = useAlternativeBlockPatterns( area, rootClientId );
	const hasReplacements = !! templateParts.length || !! blockPatterns.length;
	const areaObject = useTemplatePartArea( area );
	const hasBlockOverlay = useBlockOverlayActive( clientId );
	const blockProps = useBlockProps(
		{
			className: hasBlockOverlay
				? 'block-editor-block-content-overlay'
				: undefined,
		},
		{ __unstableIsDisabled: hasBlockOverlay }
	);
	const isPlaceholder = ! slug;
	const isEntityAvailable = ! isPlaceholder && ! isMissing && isResolved;
	const TagName = tagName || areaObject.tagName;

	// The `isSelected` check ensures the `BlockSettingsMenuControls` fill
	// doesn't render multiple times. The block controls has similar internal check.
	const canReplace =
		isSelected &&
		isEntityAvailable &&
		hasReplacements &&
		( area === 'header' || area === 'footer' );

	// We don't want to render a missing state if we have any inner blocks.
	// A new template part is automatically created if we have any inner blocks but no entity.
	if (
		innerBlocks.length === 0 &&
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

	return (
		<RecursionProvider uniqueId={ templatePartId }>
			<TemplatePartAdvancedControls
				tagName={ tagName }
				setAttributes={ setAttributes }
				isEntityAvailable={ isEntityAvailable }
				templatePartId={ templatePartId }
				defaultWrapper={ areaObject.tagName }
			/>
			{ isPlaceholder && (
				<TagName { ...blockProps }>
					<TemplatePartPlaceholder
						area={ attributes.area }
						templatePartId={ templatePartId }
						rootClientId={ rootClientId }
						setAttributes={ setAttributes }
						onOpenSelectionModal={ () =>
							setIsTemplatePartSelectionOpen( true )
						}
					/>
				</TagName>
			) }
			{ canReplace && (
				<BlockSettingsMenuControls>
					{ () => (
						<MenuItem
							onClick={ () => {
								setIsTemplatePartSelectionOpen( true );
							} }
						>
							{ createInterpolateElement(
								__( 'Replace <BlockTitle />' ),
								{
									BlockTitle: (
										<BlockTitle
											clientId={ clientId }
											maximumLength={ 25 }
										/>
									),
								}
							) }
						</MenuItem>
					) }
				</BlockSettingsMenuControls>
			) }
			{ isEntityAvailable && (
				<TemplatePartInnerBlocks
					tagName={ TagName }
					blockProps={ blockProps }
					postId={ templatePartId }
					hasInnerBlocks={ innerBlocks.length > 0 }
					layout={ layout }
				/>
			) }
			{ ! isPlaceholder && ! isResolved && (
				<TagName { ...blockProps }>
					<Spinner />
				</TagName>
			) }
			{ isTemplatePartSelectionOpen && (
				<Modal
					overlayClassName="block-library-template-part-selection-modal"
					title={ sprintf(
						// Translators: %s as template part area title ("Header", "Footer", etc.).
						__( 'Choose a %s' ),
						areaObject?.label.toLowerCase() ?? __( 'template part' )
					) }
					closeLabel={ __( 'Cancel' ) }
					onRequestClose={ () =>
						setIsTemplatePartSelectionOpen( false )
					}
				>
					<TemplatePartSelection
						area={ area }
						templatePartId={ templatePartId }
						rootClientId={ rootClientId }
						onTemplatePartSelect={ ( pattern ) => {
							const { templatePart } = pattern;
							setAttributes( {
								slug: templatePart.slug,
								theme: templatePart.theme,
								area: undefined,
							} );
							createSuccessNotice(
								sprintf(
									/* translators: %s: template part title. */
									__( 'Template Part "%s" inserted.' ),
									templatePart.title?.rendered ||
										templatePart.slug
								),
								{
									type: 'snackbar',
								}
							);
							setIsTemplatePartSelectionOpen( false );
						} }
						onPatternSelect={ async ( pattern, blocks ) => {
							const hasSelectedTemplatePart = !! templatePartId;
							if ( hasSelectedTemplatePart ) {
								replaceInnerBlocks( clientId, blocks );
							} else {
								const postData = createTemplatePartPostData(
									area,
									blocks,
									pattern.title
								);
								const templatePart = await saveEntityRecord(
									'postType',
									'wp_template_part',
									postData
								);
								setAttributes( {
									slug: templatePart.slug,
									theme: templatePart.theme,
									area: undefined,
								} );
							}
							setIsTemplatePartSelectionOpen( false );
						} }
					/>
				</Modal>
			) }
		</RecursionProvider>
	);
}

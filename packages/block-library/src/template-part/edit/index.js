/**
 * External dependencies
 */
import { isEmpty } from 'lodash';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import {
	BlockSettingsMenuControls,
	BlockTitle,
	useBlockProps,
	Warning,
	store as blockEditorStore,
	__experimentalRecursionProvider as RecursionProvider,
	__experimentalUseHasRecursion as useHasRecursion,
} from '@wordpress/block-editor';
import { Spinner, Modal, MenuItem } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { store as coreStore } from '@wordpress/core-data';
import { useState, createInterpolateElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import TemplatePartPlaceholder from './placeholder';
import TemplatePartSelectionModal from './selection-modal';
import { TemplatePartAdvancedControls } from './advanced-controls';
import TemplatePartInnerBlocks from './inner-blocks';
import { createTemplatePartId } from './utils/create-template-part-id';
import {
	useAlternativeBlockPatterns,
	useAlternativeTemplateParts,
	useTemplatePartArea,
} from './utils/hooks';

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
	const { isResolved, innerBlocks, isMissing, area } = useSelect(
		( select ) => {
			const { getEditedEntityRecord, hasFinishedResolution } =
				select( coreStore );
			const { getBlocks } = select( blockEditorStore );

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
				innerBlocks: getBlocks( clientId ),
				isResolved: hasResolvedEntity,
				isMissing: hasResolvedEntity && isEmpty( entityRecord ),
				area: _area,
			};
		},
		[ templatePartId, clientId ]
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
		<>
			<RecursionProvider uniqueId={ templatePartId }>
				<TemplatePartAdvancedControls
					tagName={ tagName }
					setAttributes={ setAttributes }
					isEntityAvailable={ isEntityAvailable }
					templatePartId={ templatePartId }
					defaultWrapper={ areaObject.tagName }
					hasInnerBlocks={ innerBlocks.length > 0 }
				/>
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

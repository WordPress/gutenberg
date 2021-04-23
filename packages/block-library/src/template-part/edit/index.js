/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import {
	BlockControls,
	useBlockProps,
	__experimentalUseNoRecursiveRenders as useNoRecursiveRenders,
	Warning,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import {
	Dropdown,
	ToolbarGroup,
	ToolbarButton,
	Spinner,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { store as coreStore } from '@wordpress/core-data';
import { store as editorStore } from '@wordpress/editor';

/**
 * Internal dependencies
 */
import TemplatePartInnerBlocks from './inner-blocks';
import TemplatePartPlaceholder from './placeholder';
import TemplatePartSelection from './selection';
import { TemplatePartAdvancedControls } from './advanced-controls';

export default function TemplatePartEdit( {
	attributes,
	setAttributes,
	clientId,
} ) {
	const { slug, theme, tagName, layout = {} } = attributes;
	const templatePartId = theme && slug ? theme + '//' + slug : null;

	const [ hasAlreadyRendered, RecursionProvider ] = useNoRecursiveRenders(
		templatePartId
	);

	// Set the postId block attribute if it did not exist,
	// but wait until the inner blocks have loaded to allow
	// new edits to trigger this.
	const { isResolved, innerBlocks, isMissing, defaultWrapper } = useSelect(
		( select ) => {
			const { getEditedEntityRecord, hasFinishedResolution } = select(
				coreStore
			);
			const { getBlocks } = select( blockEditorStore );

			const getEntityArgs = [
				'postType',
				'wp_template_part',
				templatePartId,
			];
			const entityRecord = templatePartId
				? getEditedEntityRecord( ...getEntityArgs )
				: null;
			const hasResolvedEntity = templatePartId
				? hasFinishedResolution(
						'getEditedEntityRecord',
						getEntityArgs
				  )
				: false;

			const defaultWrapperElement = select( editorStore )
				.__experimentalGetDefaultTemplatePartAreas()
				.find(
					( { area } ) =>
						area === ( entityRecord?.area || attributes.area )
				)?.area_tag;

			return {
				innerBlocks: getBlocks( clientId ),
				isResolved: hasResolvedEntity,
				isMissing: hasResolvedEntity && ! entityRecord,
				defaultWrapper: defaultWrapperElement || 'div',
			};
		},
		[ templatePartId, clientId ]
	);

	const blockProps = useBlockProps();
	const isPlaceholder = ! slug;
	const isEntityAvailable = ! isPlaceholder && ! isMissing && isResolved;
	const TagName = tagName || defaultWrapper;

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
		<RecursionProvider>
			<TemplatePartAdvancedControls
				tagName={ tagName }
				setAttributes={ setAttributes }
				isEntityAvailable={ isEntityAvailable }
				templatePartId={ templatePartId }
				defaultWrapper={ defaultWrapper }
			/>
			{ isPlaceholder && (
				<TagName { ...blockProps }>
					<TemplatePartPlaceholder
						area={ attributes.area }
						setAttributes={ setAttributes }
						innerBlocks={ innerBlocks }
					/>
				</TagName>
			) }
			{ isEntityAvailable && (
				<BlockControls>
					<ToolbarGroup className="wp-block-template-part__block-control-group">
						<Dropdown
							className="wp-block-template-part__preview-dropdown-button"
							contentClassName="wp-block-template-part__preview-dropdown-content"
							position="bottom right left"
							renderToggle={ ( { isOpen, onToggle } ) => (
								<ToolbarButton
									aria-expanded={ isOpen }
									onClick={ onToggle }
									// Disable when open to prevent odd FireFox bug causing reopening.
									// As noted in https://github.com/WordPress/gutenberg/pull/24990#issuecomment-689094119 .
									disabled={ isOpen }
								>
									{ __( 'Replace' ) }
								</ToolbarButton>
							) }
							renderContent={ ( { onClose } ) => (
								<TemplatePartSelection
									setAttributes={ setAttributes }
									onClose={ onClose }
								/>
							) }
						/>
					</ToolbarGroup>
				</BlockControls>
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
	);
}

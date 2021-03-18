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
import { __ } from '@wordpress/i18n';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import TemplatePartInnerBlocks from './inner-blocks';
import TemplatePartPlaceholder from './placeholder';
import TemplatePartSelection from './selection';
import { TemplatePartAdvancedControls } from './advanced-controls';
import { getTagBasedOnArea } from './get-tag-based-on-area';

export default function TemplatePartEdit( {
	attributes: { slug, theme, tagName },
	setAttributes,
	clientId,
} ) {
	const templatePartId = theme && slug ? theme + '//' + slug : null;

	const [ hasAlreadyRendered, RecursionProvider ] = useNoRecursiveRenders(
		templatePartId
	);

	// Set the postId block attribute if it did not exist,
	// but wait until the inner blocks have loaded to allow
	// new edits to trigger this.
	const { isResolved, innerBlocks, isMissing, area } = useSelect(
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

			return {
				innerBlocks: getBlocks( clientId ),
				isResolved: hasResolvedEntity,
				isMissing: hasResolvedEntity && ! entityRecord,
				area: entityRecord?.area,
			};
		},
		[ templatePartId, clientId ]
	);

	const blockProps = useBlockProps();
	const isPlaceholder = ! slug;
	const isEntityAvailable = ! isPlaceholder && ! isMissing;
	const TagName = tagName || getTagBasedOnArea( area );

	// We don't want to render a missing state if we have any inner blocks.
	// A new template part is automatically created if we have any inner blocks but no entity.
	if (
		innerBlocks.length === 0 &&
		( ( slug && ! theme ) || ( slug && isMissing ) )
	) {
		return (
			<TagName { ...blockProps }>
				<Warning>
					{ __(
						'Template part has been deleted or is unavailable.'
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
			/>
			<TagName { ...blockProps }>
				{ isPlaceholder && (
					<TemplatePartPlaceholder
						setAttributes={ setAttributes }
						innerBlocks={ innerBlocks }
					/>
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
						postId={ templatePartId }
						hasInnerBlocks={ innerBlocks.length > 0 }
					/>
				) }
				{ ! isPlaceholder && ! isResolved && <Spinner /> }
			</TagName>
		</RecursionProvider>
	);
}

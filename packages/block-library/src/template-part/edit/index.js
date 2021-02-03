/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import {
	BlockControls,
	InspectorAdvancedControls,
	useBlockProps,
	Warning,
} from '@wordpress/block-editor';
import {
	SelectControl,
	Dropdown,
	ToolbarGroup,
	ToolbarButton,
	Spinner,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { chevronUp, chevronDown } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import TemplatePartNamePanel from './name-panel';
import TemplatePartInnerBlocks from './inner-blocks';
import TemplatePartPlaceholder from './placeholder';
import TemplatePartSelection from './selection';

export default function TemplatePartEdit( {
	attributes: { slug, theme, tagName: TagName = 'div' },
	setAttributes,
	clientId,
} ) {
	const templatePartId = theme && slug ? theme + '//' + slug : null;

	// Set the postId block attribute if it did not exist,
	// but wait until the inner blocks have loaded to allow
	// new edits to trigger this.
	const { isResolved, innerBlocks, isMissing } = useSelect(
		( select ) => {
			const { getEntityRecord, hasFinishedResolution } = select( 'core' );
			const { getBlocks } = select( 'core/block-editor' );

			const getEntityArgs = [
				'postType',
				'wp_template_part',
				templatePartId,
			];
			const entityRecord = templatePartId
				? getEntityRecord( ...getEntityArgs )
				: null;
			const hasResolvedEntity = templatePartId
				? hasFinishedResolution( 'getEntityRecord', getEntityArgs )
				: false;

			return {
				innerBlocks: getBlocks( clientId ),
				isResolved: hasResolvedEntity,
				isMissing: hasResolvedEntity && ! entityRecord,
			};
		},
		[ templatePartId, clientId ]
	);

	const blockProps = useBlockProps();
	const isPlaceholder = ! slug;
	const isEntityAvailable = ! isPlaceholder && ! isMissing;

	if ( ! isPlaceholder && isMissing ) {
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

	return (
		<>
			<InspectorAdvancedControls>
				<SelectControl
					label={ __( 'HTML element' ) }
					options={ [
						{ label: __( 'Default (<div>)' ), value: 'div' },
						{ label: '<header>', value: 'header' },
						{ label: '<main>', value: 'main' },
						{ label: '<section>', value: 'section' },
						{ label: '<article>', value: 'article' },
						{ label: '<aside>', value: 'aside' },
						{ label: '<footer>', value: 'footer' },
					] }
					value={ TagName }
					onChange={ ( value ) =>
						setAttributes( { tagName: value } )
					}
				/>
			</InspectorAdvancedControls>
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
							<TemplatePartNamePanel postId={ templatePartId } />
							<Dropdown
								className="wp-block-template-part__preview-dropdown-button"
								contentClassName="wp-block-template-part__preview-dropdown-content"
								position="bottom right left"
								renderToggle={ ( { isOpen, onToggle } ) => (
									<ToolbarButton
										aria-expanded={ isOpen }
										icon={
											isOpen ? chevronUp : chevronDown
										}
										label={ __( 'Choose another' ) }
										onClick={ onToggle }
										// Disable when open to prevent odd FireFox bug causing reopening.
										// As noted in https://github.com/WordPress/gutenberg/pull/24990#issuecomment-689094119 .
										disabled={ isOpen }
									/>
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
		</>
	);
}

/**
 * External dependencies
 */
import { keyBy } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { MenuGroup, MenuItem } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { getTemplatePartIcon } from '@wordpress/editor';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as coreDataStore } from '@wordpress/core-data';
import { isTemplatePart } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { TEMPLATE_PART_AREA_TO_NAME } from '../../store/constants';

function TemplatePartItem( { area, clientId } ) {
	const { selectBlock, toggleBlockHighlight } = useDispatch(
		blockEditorStore
	);
	const highlightBlock = () => toggleBlockHighlight( clientId, true );
	const cancelHighlightBlock = () => toggleBlockHighlight( clientId, false );

	return (
		<MenuItem
			icon={ getTemplatePartIcon( area ) }
			iconPosition="left"
			onClick={ () => {
				selectBlock( clientId );
			} }
			onMouseOver={ highlightBlock }
			onMouseLeave={ cancelHighlightBlock }
			onFocus={ highlightBlock }
			onBlur={ cancelHighlightBlock }
		>
			{ TEMPLATE_PART_AREA_TO_NAME[ area ] }
		</MenuItem>
	);
}

export default function TemplateAreas( { template } ) {
	const templateAreaBlocks = useSelect(
		( select ) => {
			const templateParts = select( coreDataStore ).getEntityRecords(
				'postType',
				'wp_template_part',
				{
					per_page: -1,
				}
			);
			const templatePartsById = keyBy(
				templateParts,
				( templatePart ) => templatePart.id
			);

			const templatePartBlocksByAreas = {};

			for ( const block of template.blocks ) {
				if ( isTemplatePart( block ) ) {
					const {
						attributes: { theme, slug },
					} = block;
					const templatePartId = `${ theme }//${ slug }`;
					const templatePart = templatePartsById[ templatePartId ];

					if ( templatePart ) {
						templatePartBlocksByAreas[ templatePart.area ] = block;
					}
				}
			}

			return templatePartBlocksByAreas;
		},
		[ template.blocks ]
	);

	return (
		<MenuGroup
			label={ __( 'Template areas' ) }
			className="edit-site-template-details__template-areas"
		>
			{ Object.entries( templateAreaBlocks ).map(
				( [ area, templateAreaBlock ] ) => (
					<TemplatePartItem
						key={ area }
						area={ area }
						clientId={ templateAreaBlock.clientId }
					/>
				)
			) }
		</MenuGroup>
	);
}

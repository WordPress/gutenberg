/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { MenuGroup, MenuItem } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { getTemplatePartIcon } from '@wordpress/editor';
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../store';
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

export default function TemplateAreas() {
	const templateAreaBlocks = useSelect(
		( select ) => select( editSiteStore ).getTemplateAreaBlocks(),
		[]
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

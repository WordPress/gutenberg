/**
 * WordPress dependencies
 */
import { sprintf, __ } from '@wordpress/i18n';
import { DropdownMenu, MenuGroup, MenuItem } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { getTemplatePartIcon } from '@wordpress/editor';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { moreVertical } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../store';
import { TEMPLATE_PART_AREA_TO_NAME } from '../../store/constants';

function TemplatePartItemMore( { onClose, templatePart } ) {
	const { revertTemplate } = useDispatch( editSiteStore );

	function clearCustomizations() {
		revertTemplate( templatePart );
		onClose();
	}

	return (
		<>
			<MenuGroup>
				<MenuItem onClick={ onClose }>
					{ sprintf(
						/* translators: %s: template part title */
						__( 'Edit %s' ),
						templatePart.title?.rendered
					) }
				</MenuItem>
				<MenuItem onClick={ onClose }>
					{ __( 'Discard unsaved changes' ) }
				</MenuItem>
			</MenuGroup>
			<MenuGroup>
				<MenuItem
					info={ __( 'Restore template to theme default' ) }
					onClick={ clearCustomizations }
				>
					{ __( 'Clear customizations' ) }
				</MenuItem>
			</MenuGroup>
		</>
	);
}

function TemplatePartItem( { templatePart, clientId } ) {
	const { selectBlock, toggleBlockHighlight } = useDispatch(
		blockEditorStore
	);
	const highlightBlock = () => toggleBlockHighlight( clientId, true );
	const cancelHighlightBlock = () => toggleBlockHighlight( clientId, false );

	return (
		<div
			role="menuitem"
			className="edit-site-template-details__template-areas-item"
		>
			<MenuItem
				role="button"
				icon={ getTemplatePartIcon( templatePart.area ) }
				iconPosition="left"
				onClick={ () => {
					selectBlock( clientId );
				} }
				onMouseOver={ highlightBlock }
				onMouseLeave={ cancelHighlightBlock }
				onFocus={ highlightBlock }
				onBlur={ cancelHighlightBlock }
			>
				{ TEMPLATE_PART_AREA_TO_NAME[ templatePart.area ] }
			</MenuItem>

			<DropdownMenu
				icon={ moreVertical }
				label="More options"
				className="edit-site-template-details__template-areas-item-more"
			>
				{ ( { onClose } ) => (
					<TemplatePartItemMore
						onClose={ onClose }
						templatePart={ templatePart }
					/>
				) }
			</DropdownMenu>
		</div>
	);
}

export default function TemplateAreas() {
	const templateParts = useSelect(
		( select ) => select( editSiteStore ).getTemplateParts(),
		[]
	);

	if ( ! templateParts.length ) {
		return null;
	}

	return (
		<MenuGroup
			label={ __( 'Areas' ) }
			className="edit-site-template-details__group edit-site-template-details__template-areas"
		>
			{ templateParts.map( ( { templatePart, block } ) => (
				<TemplatePartItem
					key={ templatePart.area }
					clientId={ block.clientId }
					templatePart={ templatePart }
				/>
			) ) }
		</MenuGroup>
	);
}

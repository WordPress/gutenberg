/**
 * WordPress dependencies
 */
import { sprintf, __ } from '@wordpress/i18n';
import { DropdownMenu, MenuGroup, MenuItem } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { moreVertical } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../store';
import isTemplateRevertable from '../../utils/is-template-revertable';
import { useLocation } from '../routes';
import { useLink } from '../routes/link';

function TemplatePartItemMore( {
	onClose,
	templatePart,
	closeTemplateDetailsDropdown,
} ) {
	const { revertTemplate } = useDispatch( editSiteStore );
	const { params } = useLocation();
	const editLinkProps = useLink(
		{
			postId: templatePart.id,
			postType: templatePart.type,
		},
		{
			fromTemplateId: params.postId,
		}
	);

	function editTemplatePart( event ) {
		editLinkProps.onClick( event );
		onClose();
		closeTemplateDetailsDropdown();
	}

	function clearCustomizations() {
		revertTemplate( templatePart );
		onClose();
		closeTemplateDetailsDropdown();
	}

	return (
		<>
			<MenuGroup>
				<MenuItem { ...editLinkProps } onClick={ editTemplatePart }>
					{ sprintf(
						/* translators: %s: template part title */
						__( 'Edit %s' ),
						templatePart.title?.rendered
					) }
				</MenuItem>
			</MenuGroup>
			{ isTemplateRevertable( templatePart ) && (
				<MenuGroup>
					<MenuItem
						info={ __( 'Restore template to default state' ) }
						onClick={ clearCustomizations }
					>
						{ __( 'Clear customizations' ) }
					</MenuItem>
				</MenuGroup>
			) }
		</>
	);
}

function TemplatePartItem( {
	templatePart,
	clientId,
	closeTemplateDetailsDropdown,
} ) {
	const { selectBlock, toggleBlockHighlight } = useDispatch(
		blockEditorStore
	);
	const templatePartArea = useSelect(
		( select ) => {
			const defaultAreas = select(
				editorStore
			).__experimentalGetDefaultTemplatePartAreas();

			return defaultAreas.find(
				( defaultArea ) => defaultArea.area === templatePart.area
			);
		},
		[ templatePart.area ]
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
				icon={ templatePartArea?.icon }
				iconPosition="left"
				onClick={ () => {
					selectBlock( clientId );
				} }
				onMouseOver={ highlightBlock }
				onMouseLeave={ cancelHighlightBlock }
				onFocus={ highlightBlock }
				onBlur={ cancelHighlightBlock }
			>
				{ templatePartArea?.label }
			</MenuItem>

			<DropdownMenu
				icon={ moreVertical }
				label={ __( 'More options' ) }
				className="edit-site-template-details__template-areas-item-more"
			>
				{ ( { onClose } ) => (
					<TemplatePartItemMore
						onClose={ onClose }
						templatePart={ templatePart }
						closeTemplateDetailsDropdown={
							closeTemplateDetailsDropdown
						}
					/>
				) }
			</DropdownMenu>
		</div>
	);
}

export default function TemplateAreas( { closeTemplateDetailsDropdown } ) {
	const templateParts = useSelect(
		( select ) => select( editSiteStore ).getCurrentTemplateTemplateParts(),
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
					key={ templatePart.slug }
					clientId={ block.clientId }
					templatePart={ templatePart }
					closeTemplateDetailsDropdown={
						closeTemplateDetailsDropdown
					}
				/>
			) ) }
		</MenuGroup>
	);
}

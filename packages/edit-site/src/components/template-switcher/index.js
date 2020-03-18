/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { useState, useCallback } from '@wordpress/element';
import {
	Tooltip,
	Icon,
	DropdownMenu,
	MenuGroup,
	MenuItemsChoice,
	MenuItem,
} from '@wordpress/components';
import { layout, plus } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import AddTemplate from '../add-template';
import TemplatePreview from './preview';

function TemplateLabel( { template } ) {
	return (
		<div className="edit-site-template-switcher__label">
			{ template.slug }{ ' ' }
			{ template.status !== 'auto-draft' && (
				<Tooltip text={ __( 'Customized' ) }>
					<div className="edit-site-template-switcher__label-customized-icon-container">
						<Icon
							icon="marker"
							className="edit-site-template-switcher__label-customized-icon-icon"
						/>
					</div>
				</Tooltip>
			) }
		</div>
	);
}

export default function TemplateSwitcher( {
	ids,
	templatePartIds,
	activeId,
	isTemplatePart,
	onActiveIdChange,
	onActiveTemplatePartIdChange,
	onAddTemplateId,
} ) {
	const [ hoveredTemplate, setHoveredTemplate ] = useState();
	const onHoverTemplate = ( id ) => {
		setHoveredTemplate( { id, type: 'template' } );
	};
	const onHoverTemplatePart = ( id ) => {
		setHoveredTemplate( { id, type: 'template-part' } );
	};
	const { templates, templateParts } = useSelect(
		( select ) => {
			const { getEntityRecord } = select( 'core' );
			return {
				templates: ids.map( ( id ) => {
					const template = getEntityRecord(
						'postType',
						'wp_template',
						id
					);
					return {
						label: template ? (
							<TemplateLabel template={ template } />
						) : (
							__( 'loading…' )
						),
						value: id,
						slug: template ? template.slug : __( 'loading…' ),
					};
				} ),
				templateParts: templatePartIds.map( ( id ) => {
					const template = getEntityRecord(
						'postType',
						'wp_template_part',
						id
					);
					return {
						label: template ? (
							<TemplateLabel template={ template } />
						) : (
							__( 'loading…' )
						),
						value: id,
						slug: template ? template.slug : __( 'loading…' ),
					};
				} ),
			};
		},
		[ ids, templatePartIds ]
	);
	const [ isAddTemplateOpen, setIsAddTemplateOpen ] = useState( false );
	return (
		<>
			<DropdownMenu
				popoverProps={ {
					className: 'edit-site-template-switcher__popover',
					position: 'bottom right',
				} }
				icon={ layout }
				label={ __( 'Switch Template' ) }
				toggleProps={ {
					children: ( isTemplatePart
						? templateParts
						: templates
					).find( ( choice ) => choice.value === activeId ).slug,
				} }
			>
				{ ( { onClose } ) => (
					<>
						<MenuGroup label={ __( 'Templates' ) }>
							<MenuItemsChoice
								choices={ templates }
								value={
									! isTemplatePart ? activeId : undefined
								}
								onSelect={ onActiveIdChange }
								onHover={ onHoverTemplate }
							/>
							<MenuItem
								icon={ plus }
								onClick={ () => {
									onClose();
									setIsAddTemplateOpen( true );
								} }
							>
								{ __( 'New' ) }
							</MenuItem>
						</MenuGroup>
						<MenuGroup label={ __( 'Template Parts' ) }>
							<MenuItemsChoice
								choices={ templateParts }
								value={ isTemplatePart ? activeId : undefined }
								onSelect={ onActiveTemplatePartIdChange }
								onHover={ onHoverTemplatePart }
							/>
						</MenuGroup>
						{ !! hoveredTemplate?.id && (
							<TemplatePreview item={ hoveredTemplate } />
						) }
					</>
				) }
			</DropdownMenu>
			<AddTemplate
				ids={ ids }
				onAddTemplateId={ onAddTemplateId }
				onRequestClose={ useCallback(
					() => setIsAddTemplateOpen( false ),
					[]
				) }
				isOpen={ isAddTemplateOpen }
			/>
		</>
	);
}

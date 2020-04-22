/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { useState, useCallback } from '@wordpress/element';
import {
	Tooltip,
	DropdownMenu,
	MenuGroup,
	MenuItemsChoice,
	MenuItem,
} from '@wordpress/components';
import { plus } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import AddTemplate from '../add-template';
import TemplatePreview from './preview';

function TemplateLabel( { template } ) {
	return (
		<>
			{ template.slug }{ ' ' }
			{ template.status !== 'auto-draft' && (
				<Tooltip text={ __( 'Customized' ) }>
					<span className="edit-site-template-switcher__label-customized-dot" />
				</Tooltip>
			) }
		</>
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
	const { currentTheme, templates, templateParts } = useSelect(
		( select ) => {
			const { getCurrentTheme, getEntityRecord } = select( 'core' );
			return {
				currentTheme: getCurrentTheme(),
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
							__( 'Loading…' )
						),
						value: id,
						slug: template ? template.slug : __( 'Loading…' ),
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
							__( 'Loading…' )
						),
						value: id,
						slug: template ? template.slug : __( 'Loading…' ),
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
				icon={ null }
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
						<MenuGroup label={ __( 'Current theme' ) }>
							<MenuItem>{ currentTheme.name }</MenuItem>
						</MenuGroup>
						{ !! hoveredTemplate?.id && (
							<TemplatePreview item={ hoveredTemplate } />
						) }
						<div className="edit-site-template-switcher__footer" />
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

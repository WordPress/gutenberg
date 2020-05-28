/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { useState } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import {
	Tooltip,
	DropdownMenu,
	MenuGroup,
	MenuItemsChoice,
	MenuItem,
} from '@wordpress/components';
import { Icon, home, plus, undo } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import TemplatePreview from './template-preview';
import ThemePreview from './theme-preview';

const TEMPLATE_OVERRIDES = {
	page: ( slug ) => `page-${ slug }`,
	category: ( slug ) => `category-${ slug }`,
	post: ( slug ) => `single-post-${ slug }`,
};

function TemplateLabel( { template, homeId } ) {
	return (
		<>
			{ template.slug }{ ' ' }
			{ template.id === homeId && (
				<Tooltip text={ __( 'Home' ) }>
					<div className="edit-site-template-switcher__label-home-icon">
						<Icon icon={ home } />
					</div>
				</Tooltip>
			) }
			{ template.status !== 'auto-draft' && (
				<Tooltip text={ __( 'Customized' ) }>
					<span className="edit-site-template-switcher__label-customized-dot" />
				</Tooltip>
			) }
		</>
	);
}

export default function TemplateSwitcher( {
	templatePartIds,
	page,
	activeId,
	activeTemplatePartId,
	homeId,
	isTemplatePart,
	onActiveIdChange,
	onActiveTemplatePartIdChange,
	onAddTemplateId,
	onRemoveTemplateId,
} ) {
	const [ hoveredTemplate, setHoveredTemplate ] = useState();
	const [ themePreviewVisible, setThemePreviewVisible ] = useState( false );

	const onHoverTemplatePart = ( id ) => {
		setHoveredTemplate( { id, type: 'template-part' } );
	};
	const onMouseEnterTheme = () => {
		setThemePreviewVisible( () => true );
	};
	const onMouseLeaveTheme = () => {
		setThemePreviewVisible( () => false );
	};

	const { currentTheme, template, templateParts } = useSelect(
		( select ) => {
			const { getCurrentTheme, getEntityRecord } = select( 'core' );
			const _template = getEntityRecord(
				'postType',
				'wp_template',
				activeId
			);
			return {
				currentTheme: getCurrentTheme(),
				template: {
					label: _template ? (
						<TemplateLabel
							template={ _template }
							homeId={ homeId }
						/>
					) : (
						__( 'Loading…' )
					),
					value: activeId,
					slug: _template ? _template.slug : __( 'Loading…' ),
					content: _template?.content,
				},
				templateParts: templatePartIds.map( ( id ) => {
					const templatePart = getEntityRecord(
						'postType',
						'wp_template_part',
						id
					);
					return {
						label: templatePart ? (
							<TemplateLabel template={ templatePart } />
						) : (
							__( 'Loading…' )
						),
						value: id,
						slug: templatePart
							? templatePart.slug
							: __( 'Loading…' ),
					};
				} ),
			};
		},
		[ activeId, templatePartIds, homeId ]
	);

	const { saveEntityRecord } = useDispatch( 'core' );

	const overwriteSlug =
		TEMPLATE_OVERRIDES[ page.type ] &&
		page.slug &&
		TEMPLATE_OVERRIDES[ page.type ]( page.slug );
	const overwriteTemplate = async () => {
		const newTemplate = await saveEntityRecord( 'postType', 'wp_template', {
			slug: overwriteSlug,
			title: overwriteSlug,
			status: 'publish',
			content: template.content.raw,
		} );
		onAddTemplateId( newTemplate.id );
	};
	const unoverwriteTemplate = async () => {
		await apiFetch( {
			path: `/wp/v2/templates/${ template.value }`,
			method: 'DELETE',
		} );
		onRemoveTemplateId( template.value );
	};

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
						: [ template ]
					).find(
						( choice ) =>
							choice.value ===
							( isTemplatePart ? activeTemplatePartId : activeId )
					).slug,
				} }
			>
				{ () => (
					<>
						<MenuGroup label={ __( 'Template' ) }>
							<MenuItem
								onClick={ () => onActiveIdChange( activeId ) }
							>
								{ template.label }
							</MenuItem>
							{ overwriteSlug &&
								overwriteSlug !== template.slug && (
									<MenuItem
										icon={ plus }
										onClick={ overwriteTemplate }
									>
										{ __( 'Overwrite Template' ) }
									</MenuItem>
								) }
							{ overwriteSlug === template.slug && (
								<MenuItem
									icon={ undo }
									onClick={ unoverwriteTemplate }
								>
									{ __( 'Revert to Parent' ) }
								</MenuItem>
							) }
						</MenuGroup>
						<MenuGroup label={ __( 'Template Parts' ) }>
							<MenuItemsChoice
								choices={ templateParts }
								value={
									isTemplatePart
										? activeTemplatePartId
										: undefined
								}
								onSelect={ onActiveTemplatePartIdChange }
								onHover={ onHoverTemplatePart }
							/>
						</MenuGroup>
						<MenuGroup label={ __( 'Current theme' ) }>
							<MenuItem
								onMouseEnter={ onMouseEnterTheme }
								onMouseLeave={ onMouseLeaveTheme }
							>
								{ currentTheme.name }
							</MenuItem>
						</MenuGroup>
						{ !! hoveredTemplate?.id && (
							<TemplatePreview item={ hoveredTemplate } />
						) }
						{ themePreviewVisible && (
							<ThemePreview theme={ currentTheme } />
						) }
						<div className="edit-site-template-switcher__footer" />
					</>
				) }
			</DropdownMenu>
		</>
	);
}

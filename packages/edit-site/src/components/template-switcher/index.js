/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { useState } from '@wordpress/element';
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
	page,
	activeId,
	activeTemplatePartId,
	isTemplatePart,
	onActiveIdChange,
	onActiveTemplatePartIdChange,
	onAddTemplate,
	onRemoveTemplate,
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

	const { currentTheme, template, templateParts, homeId } = useSelect(
		( select ) => {
			const {
				getCurrentTheme,
				getEntityRecord,
				getEntityRecords,
			} = select( 'core' );

			const _template = getEntityRecord(
				'postType',
				'wp_template',
				activeId
			);

			const { getHomeTemplateId } = select( 'core/edit-site' );

			return {
				currentTheme: getCurrentTheme(),
				template: _template,
				templateParts: _template
					? getEntityRecords( 'postType', 'wp_template_part', {
							resolved: true,
							template: _template.slug,
					  } )
					: null,
				homeId: getHomeTemplateId(),
			};
		},
		[ activeId ]
	);

	const templateItem = {
		label: template ? (
			<TemplateLabel template={ template } homeId={ homeId } />
		) : (
			__( 'Loading…' )
		),
		value: activeId,
		slug: template ? template.slug : __( 'Loading…' ),
		content: template?.content,
	};

	const templatePartItems = templateParts?.map( ( templatePart ) => ( {
		label: <TemplateLabel template={ templatePart } />,
		value: templatePart.id,
		slug: templatePart.slug,
	} ) );

	const overwriteSlug =
		page &&
		TEMPLATE_OVERRIDES[ page.type ] &&
		page.slug &&
		TEMPLATE_OVERRIDES[ page.type ]( page.slug );

	const overwriteTemplate = () =>
		onAddTemplate( {
			slug: overwriteSlug,
			title: overwriteSlug,
			status: 'publish',
			content: templateItem.content.raw,
		} );
	const revertToParent = async () => {
		onRemoveTemplate( activeId );
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
						? templatePartItems
						: [ templateItem ]
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
								{ templateItem.label }
							</MenuItem>
							{ overwriteSlug &&
								overwriteSlug !== templateItem.slug && (
									<MenuItem
										icon={ plus }
										onClick={ overwriteTemplate }
									>
										{ __( 'Overwrite Template' ) }
									</MenuItem>
								) }
							{ overwriteSlug === templateItem.slug && (
								<MenuItem
									icon={ undo }
									onClick={ revertToParent }
								>
									{ __( 'Revert to Parent' ) }
								</MenuItem>
							) }
						</MenuGroup>
						<MenuGroup label={ __( 'Template Parts' ) }>
							<MenuItemsChoice
								choices={ templatePartItems }
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
								{ currentTheme.name.raw }
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

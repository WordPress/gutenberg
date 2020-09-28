/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { useState } from '@wordpress/element';
import {
	Button,
	Tooltip,
	__experimentalNavigationGroup as NavigationGroup,
	__experimentalNavigationItem as NavigationItem,
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

function TemplateNavigationItemWithIcon( {
	item,
	icon,
	iconLabel,
	homeId,
	template,
	title,
	...props
} ) {
	if ( ! icon && ! iconLabel && template ) {
		if ( template.id === homeId ) {
			icon = home;
			iconLabel = __( 'Home' );
		} else if ( template.status !== 'auto-draft' ) {
			icon = (
				<span className="edit-site-template-switcher__customized-dot" />
			);
			iconLabel = __( 'Customized' );
		}
	}

	return (
		<NavigationItem
			item={ item }
			title={ title }
			className="edit-site-template-switcher__navigation-item"
		>
			<Button { ...props }>
				{ title }
				{ icon && (
					<Tooltip text={ iconLabel || title }>
						<div className="edit-site-template-switcher__navigation-item-icon">
							<Icon icon={ icon } />
						</div>
					</Tooltip>
				) }
			</Button>
		</NavigationItem>
	);
}

export default function TemplateSwitcher( {
	page,
	activeId,
	onActiveIdChange,
	onActiveTemplatePartIdChange,
	onAddTemplate,
	onRemoveTemplate,
} ) {
	const [ hoveredTemplatePartId, setHoveredTemplatePartId ] = useState();
	const [ themePreviewVisible, setThemePreviewVisible ] = useState( false );

	const onMouseEnterTemplatePart = ( id ) => setHoveredTemplatePartId( id );
	const onMouseLeaveTemplatePart = () => setHoveredTemplatePartId( null );

	const onMouseEnterTheme = () => setThemePreviewVisible( true );
	const onMouseLeaveTheme = () => setThemePreviewVisible( false );

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
			content: template.content.raw,
		} );
	const revertToParent = () => {
		onRemoveTemplate( activeId );
	};

	return (
		<>
			<NavigationGroup title={ __( 'Template' ) }>
				<TemplateNavigationItemWithIcon
					item={ template && `template-${ template.id }` }
					template={ template }
					title={ template?.slug || __( 'Loading…' ) }
					homeId={ homeId }
					onClick={ () => onActiveIdChange( activeId ) }
				/>

				{ overwriteSlug &&
					template &&
					overwriteSlug !== template.slug && (
						<TemplateNavigationItemWithIcon
							icon={ plus }
							onClick={ overwriteTemplate }
							title={ __( 'Overwrite Template' ) }
						/>
					) }

				{ template && overwriteSlug === template.slug && (
					<TemplateNavigationItemWithIcon
						icon={ undo }
						onClick={ revertToParent }
						title={ __( 'Revert to Parent' ) }
					/>
				) }
			</NavigationGroup>

			<NavigationGroup title={ __( 'Template Parts' ) }>
				{ templateParts?.map( ( templatePart ) => {
					const key = `template-part-${ templatePart.id }`;

					return (
						<TemplateNavigationItemWithIcon
							key={ key }
							item={ key }
							title={ templatePart.slug }
							template={ templatePart }
							onClick={ () =>
								onActiveTemplatePartIdChange( templatePart.id )
							}
							onMouseEnter={ () =>
								onMouseEnterTemplatePart( templatePart.id )
							}
							onMouseLeave={ onMouseLeaveTemplatePart }
						/>
					);
				} ) }

				{ ( ! templateParts || templateParts.length === 0 ) && (
					<NavigationItem title={ __( 'Loading…' ) } />
				) }
			</NavigationGroup>

			<NavigationGroup title={ __( 'Current theme' ) }>
				<NavigationItem
					onMouseEnter={ onMouseEnterTheme }
					onMouseLeave={ onMouseLeaveTheme }
					title={ currentTheme?.name?.raw || __( 'Loading…' ) }
				/>
			</NavigationGroup>

			{ hoveredTemplatePartId && (
				<TemplatePreview entityId={ hoveredTemplatePartId } />
			) }

			{ currentTheme && themePreviewVisible && (
				<ThemePreview theme={ currentTheme } />
			) }
		</>
	);
}

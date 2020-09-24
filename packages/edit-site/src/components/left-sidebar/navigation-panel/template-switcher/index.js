/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { useState } from '@wordpress/element';
import {
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

function NavigationItemWithIcon( { icon, title, ...props } ) {
	return (
		<NavigationItem
			title={
				<>
					{ title }{ ' ' }
					{ icon && (
						<div className="edit-site-template-switcher__label-home-icon">
							<Icon icon={ icon } />
						</div>
					) }
				</>
			}
			{ ...props }
		/>
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
	const revertToParent = () => {
		onRemoveTemplate( activeId );
	};

	return (
		<>
			<NavigationGroup title={ __( 'Template' ) }>
				<NavigationItem
					onClick={ () => onActiveIdChange( activeId ) }
					title={ templateItem.label }
				/>

				{ overwriteSlug && overwriteSlug !== templateItem.slug && (
					<NavigationItemWithIcon
						icon={ plus }
						onClick={ overwriteTemplate }
						title={ __( 'Overwrite Template' ) }
					/>
				) }

				{ overwriteSlug === templateItem.slug && (
					<NavigationItemWithIcon
						icon={ undo }
						onClick={ revertToParent }
						title={ __( 'Revert to Parent' ) }
					/>
				) }
			</NavigationGroup>

			<NavigationGroup title={ __( 'Template Parts' ) }>
				{ templatePartItems?.map( ( templatePart ) => {
					const key = `template-part-${ templatePart.value }`;

					return (
						<NavigationItemWithIcon
							key={ key }
							item={ key }
							title={ templatePart.label }
							onClick={ () =>
								onActiveTemplatePartIdChange(
									templatePart.value
								)
							}
							onMouseEnter={ () =>
								onHoverTemplatePart( templatePart.value )
							}
							onMouseLeave={ () => onHoverTemplatePart( null ) }
						/>
					);
				} ) }
			</NavigationGroup>

			<NavigationGroup title={ __( 'Current theme' ) }>
				<NavigationItem
					onMouseEnter={ onMouseEnterTheme }
					onMouseLeave={ onMouseLeaveTheme }
					title={ currentTheme.name.raw }
				/>
			</NavigationGroup>

			{ !! hoveredTemplate?.id && (
				<TemplatePreview item={ hoveredTemplate } />
			) }

			{ themePreviewVisible && <ThemePreview theme={ currentTheme } /> }
		</>
	);
}

/**
 * WordPress dependencies
 */
import {
	__experimentalItemGroup as ItemGroup,
	__experimentalItem as Item,
	__experimentalHeading as Heading,
} from '@wordpress/components';
import { useViewportMatch } from '@wordpress/compose';
import { getTemplatePartIcon } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';
import { getQueryArgs } from '@wordpress/url';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { file } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import AddNewPattern from '../add-new-pattern';
import SidebarNavigationItem from '../sidebar-navigation-item';
import SidebarNavigationScreen from '../sidebar-navigation-screen';
import CategoryItem from './category-item';
import {
	PATTERN_DEFAULT_CATEGORY,
	PATTERN_TYPES,
	TEMPLATE_PART_POST_TYPE,
} from '../../utils/constants';
import { useLink } from '../routes/link';
import usePatternCategories from './use-pattern-categories';
import useTemplatePartAreas from './use-template-part-areas';
import { store as editSiteStore } from '../../store';

function TemplatePartGroup( { areas, currentArea, currentType } ) {
	return (
		<>
			<div className="edit-site-sidebar-navigation-screen-patterns__group-header">
				<Heading level={ 2 }>{ __( 'Template parts' ) }</Heading>
			</div>
			<ItemGroup className="edit-site-sidebar-navigation-screen-patterns__group">
				{ Object.entries( areas ).map(
					( [ area, { label, templateParts } ] ) => (
						<CategoryItem
							key={ area }
							count={ templateParts?.length }
							icon={ getTemplatePartIcon( area ) }
							label={ label }
							id={ area }
							type={ TEMPLATE_PART_POST_TYPE }
							isActive={
								currentArea === area &&
								currentType === TEMPLATE_PART_POST_TYPE
							}
						/>
					)
				) }
			</ItemGroup>
		</>
	);
}

function PatternCategoriesGroup( {
	categories,
	currentCategory,
	currentType,
} ) {
	return (
		<>
			<ItemGroup className="edit-site-sidebar-navigation-screen-patterns__group">
				{ categories.map( ( category ) => (
					<CategoryItem
						key={ category.name }
						count={ category.count }
						label={ category.label }
						icon={ file }
						id={ category.name }
						type="pattern"
						isActive={
							currentCategory === `${ category.name }` &&
							( currentType === PATTERN_TYPES.theme ||
								currentType === PATTERN_TYPES.user )
						}
					/>
				) ) }
			</ItemGroup>
		</>
	);
}

export default function SidebarNavigationScreenPatterns() {
	const isMobileViewport = useViewportMatch( 'medium', '<' );
	const { categoryType, categoryId } = getQueryArgs( window.location.href );
	const currentCategory = categoryId || PATTERN_DEFAULT_CATEGORY;
	const currentType = categoryType || PATTERN_TYPES.theme;

	const { templatePartAreas, hasTemplateParts, isLoading } =
		useTemplatePartAreas();
	const { patternCategories, hasPatterns } = usePatternCategories();
	const isBlockBasedTheme = useSelect(
		( select ) => select( coreStore ).getCurrentTheme()?.is_block_theme,
		[]
	);
	const isTemplatePartsMode = useSelect( ( select ) => {
		const settings = select( editSiteStore ).getSettings();
		return !! settings.supportsTemplatePartsMode;
	}, [] );

	const templatePartsLink = useLink( {
		path: '/wp_template_part/all',
		// If a classic theme that supports template parts accessed
		// the Patterns page directly, preserve that state in the URL.
		didAccessPatternsPage:
			! isBlockBasedTheme && isTemplatePartsMode ? 1 : undefined,
	} );

	const footer = ! isMobileViewport ? (
		<ItemGroup>
			<SidebarNavigationItem
				as="a"
				href="edit.php?post_type=wp_block"
				withChevron
			>
				{ __( 'Manage all of my patterns' ) }
			</SidebarNavigationItem>
			{ ( isBlockBasedTheme || isTemplatePartsMode ) && (
				<SidebarNavigationItem withChevron { ...templatePartsLink }>
					{ __( 'Manage all template parts' ) }
				</SidebarNavigationItem>
			) }
		</ItemGroup>
	) : undefined;

	return (
		<SidebarNavigationScreen
			isRoot={ ! isBlockBasedTheme }
			title={ __( 'Patterns' ) }
			description={ __(
				'Manage what patterns are available when editing the site.'
			) }
			actions={ <AddNewPattern /> }
			footer={ footer }
			content={
				<>
					{ isLoading && __( 'Loading patterns…' ) }
					{ ! isLoading && (
						<>
							{ ! hasTemplateParts && ! hasPatterns && (
								<ItemGroup className="edit-site-sidebar-navigation-screen-patterns__group">
									<Item>
										{ __(
											'No template parts or patterns found'
										) }
									</Item>
								</ItemGroup>
							) }
							{ hasPatterns && (
								<PatternCategoriesGroup
									categories={ patternCategories }
									currentCategory={ currentCategory }
									currentType={ currentType }
								/>
							) }
							{ hasTemplateParts && (
								<TemplatePartGroup
									areas={ templatePartAreas }
									currentArea={ currentCategory }
									currentType={ currentType }
								/>
							) }
						</>
					) }
				</>
			}
		/>
	);
}

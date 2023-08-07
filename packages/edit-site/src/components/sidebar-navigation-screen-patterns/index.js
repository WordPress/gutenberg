/**
 * WordPress dependencies
 */
import {
	__experimentalItemGroup as ItemGroup,
	__experimentalItem as Item,
	Flex,
	Icon,
	Tooltip,
	__experimentalHeading as Heading,
} from '@wordpress/components';
import { useViewportMatch } from '@wordpress/compose';
import { getTemplatePartIcon } from '@wordpress/editor';
import { __, sprintf } from '@wordpress/i18n';
import { getQueryArgs } from '@wordpress/url';
import { file, starFilled, lockSmall } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import AddNewPattern from '../add-new-pattern';
import SidebarNavigationItem from '../sidebar-navigation-item';
import SidebarNavigationScreen from '../sidebar-navigation-screen';
import CategoryItem from './category-item';
import { DEFAULT_CATEGORY, DEFAULT_TYPE } from '../page-patterns/utils';
import { useLink } from '../routes/link';
import usePatternCategories from './use-pattern-categories';
import useMyPatterns from './use-my-patterns';
import useTemplatePartAreas from './use-template-part-areas';

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
							type="wp_template_part"
							isActive={
								currentArea === area &&
								currentType === 'wp_template_part'
							}
						/>
					)
				) }
			</ItemGroup>
		</>
	);
}

function ThemePatternsGroup( { categories, currentCategory, currentType } ) {
	return (
		<>
			<ItemGroup className="edit-site-sidebar-navigation-screen-patterns__group">
				{ categories.map( ( category ) => (
					<CategoryItem
						key={ category.name }
						count={ category.count }
						label={
							<Flex justify="left" align="center" gap={ 0 }>
								{ category.label }
								<Tooltip
									position="top center"
									text={ sprintf(
										// translators: %s: The pattern category name.
										'"%s" patterns cannot be edited.',
										category.label
									) }
								>
									<span className="edit-site-sidebar-navigation-screen-pattern__lock-icon">
										<Icon icon={ lockSmall } size={ 24 } />
									</span>
								</Tooltip>
							</Flex>
						}
						icon={ file }
						id={ category.name }
						type="pattern"
						isActive={
							currentCategory === `${ category.name }` &&
							currentType === 'pattern'
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
	const currentCategory = categoryId || DEFAULT_CATEGORY;
	const currentType = categoryType || DEFAULT_TYPE;

	const { templatePartAreas, hasTemplateParts, isLoading } =
		useTemplatePartAreas();
	const { patternCategories, hasPatterns } = usePatternCategories();
	const { myPatterns } = useMyPatterns();

	const templatePartsLink = useLink( { path: '/wp_template_part/all' } );
	const footer = ! isMobileViewport ? (
		<ItemGroup>
			<SidebarNavigationItem
				as="a"
				href="edit.php?post_type=wp_block"
				withChevron
			>
				{ __( 'Manage all of my patterns' ) }
			</SidebarNavigationItem>
			<SidebarNavigationItem withChevron { ...templatePartsLink }>
				{ __( 'Manage all template parts' ) }
			</SidebarNavigationItem>
		</ItemGroup>
	) : undefined;

	return (
		<SidebarNavigationScreen
			title={ __( 'Patterns' ) }
			description={ __(
				'Manage what patterns are available when editing the site.'
			) }
			actions={ <AddNewPattern /> }
			footer={ footer }
			content={
				<>
					{ isLoading && __( 'Loading patterns' ) }
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
							<ItemGroup className="edit-site-sidebar-navigation-screen-patterns__group">
								<CategoryItem
									key={ myPatterns.name }
									count={
										! myPatterns.count
											? '0'
											: myPatterns.count
									}
									label={ myPatterns.label }
									icon={ starFilled }
									id={ myPatterns.name }
									type="wp_block"
									isActive={
										currentCategory ===
											`${ myPatterns.name }` &&
										currentType === 'wp_block'
									}
								/>
							</ItemGroup>
							{ hasPatterns && (
								<ThemePatternsGroup
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

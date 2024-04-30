/**
 * WordPress dependencies
 */
import {
	__experimentalItemGroup as ItemGroup,
	__experimentalItem as Item,
} from '@wordpress/components';
import { getTemplatePartIcon } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { file } from '@wordpress/icons';
import { privateApis as routerPrivateApis } from '@wordpress/router';

/**
 * Internal dependencies
 */
import AddNewPattern from '../add-new-pattern';
import SidebarNavigationScreen from '../sidebar-navigation-screen';
import CategoryItem from './category-item';
import {
	PATTERN_DEFAULT_CATEGORY,
	PATTERN_TYPES,
	TEMPLATE_PART_POST_TYPE,
	TEMPLATE_PART_ALL_AREAS_CATEGORY,
} from '../../utils/constants';
import usePatternCategories from './use-pattern-categories';
import useTemplatePartAreas from './use-template-part-areas';
import { unlock } from '../../lock-unlock';

const { useLocation } = unlock( routerPrivateApis );

function CategoriesGroup( {
	path,
	templatePartAreas,
	patternCategories,
	currentCategory,
	currentType,
} ) {
	const [ allPatterns, ...otherPatterns ] = patternCategories;

	return (
		<ItemGroup className="edit-site-sidebar-navigation-screen-patterns__group">
			<CategoryItem
				key="all"
				path={ path }
				count={ Object.values( templatePartAreas )
					.map( ( { templateParts } ) => templateParts?.length || 0 )
					.reduce( ( acc, val ) => acc + val, 0 ) }
				icon={ getTemplatePartIcon() } /* no name, so it provides the fallback icon */
				label={ __( 'All template parts' ) }
				id={ TEMPLATE_PART_ALL_AREAS_CATEGORY }
				type={ TEMPLATE_PART_POST_TYPE }
				isActive={
					currentCategory === TEMPLATE_PART_ALL_AREAS_CATEGORY &&
					currentType === TEMPLATE_PART_POST_TYPE
				}
			/>
			{ Object.entries( templatePartAreas ).map(
				( [ area, { label, templateParts } ] ) => (
					<CategoryItem
						key={ area }
						path={ path }
						count={ templateParts?.length }
						icon={ getTemplatePartIcon( area ) }
						label={ label }
						id={ area }
						type={ TEMPLATE_PART_POST_TYPE }
						isActive={
							currentCategory === area &&
							currentType === TEMPLATE_PART_POST_TYPE
						}
					/>
				)
			) }
			<div className="edit-site-sidebar-navigation-screen-patterns__divider" />
			{ allPatterns && (
				<CategoryItem
					key={ allPatterns.name }
					path={ path }
					count={ allPatterns.count }
					label={ allPatterns.label }
					icon={ file }
					id={ allPatterns.name }
					type="pattern"
					isActive={
						currentCategory === `${ allPatterns.name }` &&
						( currentType === PATTERN_TYPES.theme ||
							currentType === PATTERN_TYPES.user )
					}
				/>
			) }
			{ otherPatterns.map( ( category ) => (
				<CategoryItem
					key={ category.name }
					path={ path }
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
	);
}

export default function SidebarNavigationScreenPatterns() {
	const {
		params: { categoryType, categoryId, path },
	} = useLocation();
	const currentCategory = categoryId || PATTERN_DEFAULT_CATEGORY;
	const currentType = categoryType || PATTERN_TYPES.theme;

	const { templatePartAreas, hasTemplateParts, isLoading } =
		useTemplatePartAreas();
	const { patternCategories, hasPatterns } = usePatternCategories();
	const isBlockBasedTheme = useSelect(
		( select ) => select( coreStore ).getCurrentTheme()?.is_block_theme,
		[]
	);

	/**
	 * This sidebar needs to temporarily accomodate two different "URLs":
	 *
	 * 1. path = /patterns
	 *    Block based themes. Also classic themes can access this URL, though it's not linked anywhere.
	 *
	 * 2. path = /wp_template_part/all
	 *    Classic themes with support for block-template-parts. We need to list only Template Parts in this case.
	 *    The URL is accessible from the Appearance > Template Parts menu.
	 *
	 * This is temporary. We aim to consolidate to /patterns.
	 */
	return (
		<SidebarNavigationScreen
			isRoot={ ! isBlockBasedTheme }
			title={ __( 'Patterns' ) }
			description={ __(
				'Manage what patterns are available when editing the site.'
			) }
			actions={ <AddNewPattern /> }
			content={
				<>
					{ isLoading && __( 'Loading items…' ) }
					{ ! isLoading && (
						<>
							{ ! hasTemplateParts && ! hasPatterns && (
								<ItemGroup className="edit-site-sidebar-navigation-screen-patterns__group">
									<Item>{ __( 'No items found' ) }</Item>
								</ItemGroup>
							) }
							<CategoriesGroup
								path={ path }
								templatePartAreas={ templatePartAreas }
								patternCategories={ patternCategories }
								currentCategory={ currentCategory }
								currentType={ currentType }
							/>
						</>
					) }
				</>
			}
		/>
	);
}

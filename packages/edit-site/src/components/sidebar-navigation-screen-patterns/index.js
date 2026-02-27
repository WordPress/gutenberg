/**
 * WordPress dependencies
 */
import {
	__experimentalItemGroup as ItemGroup,
	__experimentalItem as Item,
} from '@wordpress/components';
import { getTemplatePartIcon } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';
import { file } from '@wordpress/icons';
import { privateApis as routerPrivateApis } from '@wordpress/router';

/**
 * Internal dependencies
 */
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
				( [ area, { label, templateParts, icon } ] ) => (
					<CategoryItem
						key={ area }
						count={ templateParts?.length }
						icon={ getTemplatePartIcon( icon ) }
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
					count={ allPatterns.count }
					label={ allPatterns.label }
					icon={ file }
					id={ allPatterns.name }
					type={ PATTERN_TYPES.user }
					isActive={
						currentCategory === `${ allPatterns.name }` &&
						currentType === PATTERN_TYPES.user
					}
				/>
			) }
			{ otherPatterns.map( ( category ) => (
				<CategoryItem
					key={ category.name }
					count={ category.count }
					label={ category.label }
					icon={ file }
					id={ category.name }
					type={ PATTERN_TYPES.user }
					isActive={
						currentCategory === `${ category.name }` &&
						currentType === PATTERN_TYPES.user
					}
				/>
			) ) }
		</ItemGroup>
	);
}

export default function SidebarNavigationScreenPatterns( { backPath } ) {
	const {
		query: { postType = 'wp_block', categoryId },
	} = useLocation();
	const currentCategory =
		categoryId ||
		( postType === PATTERN_TYPES.user
			? PATTERN_DEFAULT_CATEGORY
			: TEMPLATE_PART_ALL_AREAS_CATEGORY );

	const { templatePartAreas, hasTemplateParts, isLoading } =
		useTemplatePartAreas();
	const { patternCategories, hasPatterns } = usePatternCategories();

	return (
		<SidebarNavigationScreen
			title={ __( 'Patterns' ) }
			description={ __(
				'Manage what patterns are available when editing the site.'
			) }
			isRoot={ ! backPath }
			backPath={ backPath }
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
								templatePartAreas={ templatePartAreas }
								patternCategories={ patternCategories }
								currentCategory={ currentCategory }
								currentType={ postType }
							/>
						</>
					) }
				</>
			}
		/>
	);
}

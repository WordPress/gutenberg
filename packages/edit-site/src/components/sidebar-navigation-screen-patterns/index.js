/**
 * WordPress dependencies
 */
import {
	__experimentalItemGroup as ItemGroup,
	__experimentalItem as Item,
} from '@wordpress/components';
import { useEntityRecords } from '@wordpress/core-data';
import { getTemplatePartIcon } from '@wordpress/editor';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { file } from '@wordpress/icons';
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { useViewConfig } from '@wordpress/views';

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
	TEMPLATE_PART_AREA_DEFAULT_CATEGORY,
} from '../../utils/constants';
import useThemePatterns from './use-theme-patterns';
import usePatterns from '../page-patterns/use-patterns';
import { unlock } from '../../lock-unlock';

const { useLocation } = unlock( routerPrivateApis );

function useTemplatePartCounts() {
	const { records: templateParts, isResolving: isLoading } = useEntityRecords(
		'postType',
		TEMPLATE_PART_POST_TYPE,
		{
			per_page: -1,
		}
	);

	const counts = useMemo( () => {
		if ( ! templateParts ) {
			return {};
		}
		const result = { [ TEMPLATE_PART_ALL_AREAS_CATEGORY ]: 0 };
		templateParts.forEach( ( part ) => {
			const area = part.area || TEMPLATE_PART_AREA_DEFAULT_CATEGORY;
			result[ area ] = ( result[ area ] || 0 ) + 1;
			result[ TEMPLATE_PART_ALL_AREAS_CATEGORY ] += 1;
		} );
		return result;
	}, [ templateParts ] );

	return { counts, isLoading };
}

function usePatternCounts() {
	const themePatterns = useThemePatterns();
	const { patterns: userPatterns, categories: userPatternCategories } =
		usePatterns( PATTERN_TYPES.user );

	const counts = useMemo( () => {
		const result = {
			[ PATTERN_DEFAULT_CATEGORY ]:
				themePatterns.length + userPatterns.length,
			'my-patterns': userPatterns.length,
		};

		// Count theme patterns per category.
		themePatterns.forEach( ( pattern ) => {
			pattern.categories?.forEach( ( cat ) => {
				result[ cat ] = ( result[ cat ] || 0 ) + 1;
			} );
			if ( ! pattern.categories?.length ) {
				result.uncategorized = ( result.uncategorized || 0 ) + 1;
			}
		} );

		// Count user patterns per category.
		userPatterns.forEach( ( pattern ) => {
			pattern.wp_pattern_category?.forEach( ( catId ) => {
				const category = userPatternCategories.find(
					( cat ) => cat.id === catId
				);
				if ( category ) {
					result[ category.name ] =
						( result[ category.name ] || 0 ) + 1;
				}
			} );
			if (
				! pattern.wp_pattern_category?.length ||
				! pattern.wp_pattern_category?.some( ( catId ) =>
					userPatternCategories.find( ( cat ) => cat.id === catId )
				)
			) {
				result.uncategorized = ( result.uncategorized || 0 ) + 1;
			}
		} );

		return result;
	}, [ themePatterns, userPatterns, userPatternCategories ] );

	return counts;
}

function CategoriesGroup( {
	templatePartViews,
	patternViews,
	templatePartCounts,
	patternCounts,
	currentCategory,
	currentType,
} ) {
	return (
		<ItemGroup className="edit-site-sidebar-navigation-screen-patterns__group">
			{ templatePartViews?.map( ( view ) => (
				<CategoryItem
					key={ view.slug }
					count={ templatePartCounts[ view.slug ] }
					icon={ getTemplatePartIcon(
						view.slug === TEMPLATE_PART_ALL_AREAS_CATEGORY
							? undefined
							: view.slug
					) }
					label={ view.title }
					id={ view.slug }
					type={ TEMPLATE_PART_POST_TYPE }
					isActive={
						currentCategory === view.slug &&
						currentType === TEMPLATE_PART_POST_TYPE
					}
				/>
			) ) }
			<div className="edit-site-sidebar-navigation-screen-patterns__divider" />
			{ patternViews?.map( ( view ) => (
				<CategoryItem
					key={ view.slug }
					count={ patternCounts[ view.slug ] }
					label={ view.title }
					icon={ file }
					id={ view.slug }
					type={ PATTERN_TYPES.user }
					isActive={
						currentCategory === `${ view.slug }` &&
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

	const { view_list: templatePartViews } = useViewConfig( {
		kind: 'postType',
		name: TEMPLATE_PART_POST_TYPE,
	} );
	const { view_list: patternViews } = useViewConfig( {
		kind: 'postType',
		name: PATTERN_TYPES.user,
	} );

	const { counts: templatePartCounts, isLoading } = useTemplatePartCounts();
	const patternCounts = usePatternCounts();

	const hasTemplateParts =
		templatePartCounts[ TEMPLATE_PART_ALL_AREAS_CATEGORY ] > 0;
	const hasPatterns = patternCounts[ PATTERN_DEFAULT_CATEGORY ] > 0;

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
								templatePartViews={ templatePartViews }
								patternViews={ patternViews }
								templatePartCounts={ templatePartCounts }
								patternCounts={ patternCounts }
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

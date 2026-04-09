/**
 * WordPress dependencies
 */
import {
	__experimentalItemGroup as ItemGroup,
	__experimentalItem as Item,
} from '@wordpress/components';
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
} from '../../utils/constants';
import usePatternCategories from './use-pattern-categories';
import useTemplatePartAreas from './use-template-part-areas';
import { unlock } from '../../lock-unlock';

const { useLocation } = unlock( routerPrivateApis );

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

	const { templatePartAreas, isLoading, hasTemplateParts } =
		useTemplatePartAreas();
	const templatePartCounts = useMemo( () => {
		const counts = { [ TEMPLATE_PART_ALL_AREAS_CATEGORY ]: 0 };
		Object.entries( templatePartAreas ).forEach(
			( [ area, { templateParts } ] ) => {
				const count = templateParts?.length || 0;
				counts[ area ] = count;
				counts[ TEMPLATE_PART_ALL_AREAS_CATEGORY ] += count;
			}
		);
		return counts;
	}, [ templatePartAreas ] );
	const { patternCategories } = usePatternCategories();
	const patternCounts = useMemo( () => {
		const counts = {};
		patternCategories.forEach( ( cat ) => {
			counts[ cat.name ] = cat.count;
		} );
		return counts;
	}, [ patternCategories ] );

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

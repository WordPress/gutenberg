import {
	__experimentalItemGroup as ItemGroup,
	__experimentalItem as Item,
} from '@wordpress/components';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { file } from '@wordpress/icons';
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { useViewConfig } from '@wordpress/views';
import SidebarNavigationScreen from '../sidebar-navigation-screen';
import CategoryItem from './category-item';
import { PATTERN_DEFAULT_CATEGORY, PATTERN_TYPES } from '../../utils/constants';
import usePatternCategories from './use-pattern-categories';
import { unlock } from '../../lock-unlock';

const VIEW_CONFIG_FIELDS = [ 'view_list' ];

const { useLocation } = unlock( routerPrivateApis );

function CategoriesGroup( {
	patternViews,
	patternCounts,
	currentCategory,
	currentType,
} ) {
	return (
		<ItemGroup className="edit-site-sidebar-navigation-screen-patterns__group">
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
	const currentCategory = categoryId || PATTERN_DEFAULT_CATEGORY;

	const { view_list: patternViews } = useViewConfig( {
		kind: 'postType',
		name: PATTERN_TYPES.user,
		fields: VIEW_CONFIG_FIELDS,
	} );

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
				'Manage what patterns are available when editing your site.'
			) }
			isRoot={ ! backPath }
			backPath={ backPath }
			content={
				<>
					{ ! hasPatterns && (
						<ItemGroup className="edit-site-sidebar-navigation-screen-patterns__group">
							<Item>{ __( 'No items found' ) }</Item>
						</ItemGroup>
					) }
					<CategoriesGroup
						patternViews={ patternViews }
						patternCounts={ patternCounts }
						currentCategory={ currentCategory }
						currentType={ postType }
					/>
				</>
			}
		/>
	);
}

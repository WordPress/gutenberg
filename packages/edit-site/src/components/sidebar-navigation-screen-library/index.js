/**
 * WordPress dependencies
 */
import {
	__experimentalItemGroup as ItemGroup,
	__experimentalItem as Item,
} from '@wordpress/components';
import { useViewportMatch } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import { getTemplatePartIcon } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';
import { getQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import SidebarNavigationItem from '../sidebar-navigation-item';
import SidebarNavigationScreen from '../sidebar-navigation-screen';
import CategoryItem from './category-item';
import usePatternCategories from './use-pattern-categories';
import useTemplatePartAreas from './use-template-part-areas';
import { store as editSiteStore } from '../../store';

const DEFAULT_CATEGORY = 'header';
const DEFAULT_TYPE = 'wp_template_part';

const templatePartAreaLabels = {
	header: __( 'Headers' ),
	footer: __( 'Footers' ),
	sidebar: __( 'Sidebar' ),
	uncategorized: __( 'Uncategorized' ), // TODO: Find correct label for this.
};

export default function SidebarNavigationScreenLibrary() {
	const isMobileViewport = useViewportMatch( 'medium', '<' );
	const { categoryType, categoryName } = getQueryArgs( window.location.href );
	const currentCategory = categoryName || DEFAULT_CATEGORY;
	const currentType = categoryType || DEFAULT_TYPE;

	const { templatePartAreas, hasTemplateParts, isLoading } =
		useTemplatePartAreas();
	const { patternCategories, hasPatterns } = usePatternCategories();

	const isTemplatePartsMode = useSelect( ( select ) => {
		const settings = select( editSiteStore ).getSettings();
		return !! settings.supportsTemplatePartsMode;
	}, [] );

	return (
		<SidebarNavigationScreen
			isRoot={ isTemplatePartsMode }
			title={ __( 'Library' ) }
			description={ __(
				'Manage what patterns are available when editing your site.'
			) }
			// actions={ {} }
			content={
				<>
					{ isLoading && __( 'Loading library' ) }
					{ ! isLoading && (
						<>
							{ ! hasTemplateParts && ! hasPatterns && (
								<ItemGroup className="edit-site-sidebar-navigation-screen-library__group">
									<Item>
										{ __(
											'No template parts or patterns found'
										) }
									</Item>
								</ItemGroup>
							) }
							{ hasTemplateParts && (
								<ItemGroup className="edit-site-sidebar-navigation-screen-library__group">
									{ Object.entries( templatePartAreas ).map(
										( [ area, parts ] ) => (
											<CategoryItem
												key={ area }
												count={ parts.length }
												icon={ getTemplatePartIcon(
													area
												) }
												label={
													templatePartAreaLabels[
														area
													]
												}
												name={ area }
												type="wp_template_part"
												isActive={
													currentCategory === area &&
													currentType ===
														'wp_template_part'
												}
											/>
										)
									) }
								</ItemGroup>
							) }
							{ hasPatterns && (
								<ItemGroup className="edit-site-sidebar-navigation-screen-library__group">
									{ patternCategories.map( ( category ) => (
										<CategoryItem
											key={ category.name }
											count={ category.count }
											label={ category.label }
											name={ category.name }
											type="pattern"
											isActive={
												currentCategory ===
													category.name &&
												currentType === 'pattern'
											}
										/>
									) ) }
								</ItemGroup>
							) }
							<ItemGroup>
								{ ! isMobileViewport && (
									<SidebarNavigationItem
										as="a"
										href="edit.php?post_type=wp_block"
										withChevron
									>
										{ __( 'Manage all reusable blocks' ) }
									</SidebarNavigationItem>
								) }
							</ItemGroup>
						</>
					) }
				</>
			}
		/>
	);
}

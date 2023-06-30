/**
 * WordPress dependencies
 */
import {
	__experimentalItemGroup as ItemGroup,
	__experimentalItem as Item,
	Flex,
	Icon,
	Tooltip,
} from '@wordpress/components';
import { useViewportMatch } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import { getTemplatePartIcon } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';
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
import { store as editSiteStore } from '../../store';
import { useLink } from '../routes/link';
import usePatternCategories from './use-pattern-categories';
import useMyPatterns from './use-my-patterns';
import useTemplatePartAreas from './use-template-part-areas';

const templatePartAreaLabels = {
	header: __( 'Headers' ),
	footer: __( 'Footers' ),
	sidebar: __( 'Sidebar' ),
	uncategorized: __( 'Uncategorized' ),
};

export default function SidebarNavigationScreenPatterns() {
	const isMobileViewport = useViewportMatch( 'medium', '<' );
	const { categoryType, categoryId } = getQueryArgs( window.location.href );
	const currentCategory = categoryId || DEFAULT_CATEGORY;
	const currentType = categoryType || DEFAULT_TYPE;

	const { templatePartAreas, hasTemplateParts, isLoading } =
		useTemplatePartAreas();
	const { patternCategories, hasPatterns } = usePatternCategories();
	const { myPatterns, hasPatterns: hasMyPatterns } = useMyPatterns();

	const isTemplatePartsMode = useSelect( ( select ) => {
		const settings = select( editSiteStore ).getSettings();
		return !! settings.supportsTemplatePartsMode;
	}, [] );

	const templatePartsLink = useLink( { path: '/wp_template_part/all' } );
	const footer = ! isMobileViewport ? (
		<ItemGroup>
			<SidebarNavigationItem withChevron { ...templatePartsLink }>
				{ __( 'Manage all template parts' ) }
			</SidebarNavigationItem>
			<SidebarNavigationItem
				as="a"
				href="edit.php?post_type=wp_block"
				withChevron
			>
				{ __( 'Manage all of my patterns' ) }
			</SidebarNavigationItem>
		</ItemGroup>
	) : undefined;

	return (
		<SidebarNavigationScreen
			isRoot={ isTemplatePartsMode }
			title={ __( 'Patterns' ) }
			description={ __(
				'Manage what patterns are available when editing your site.'
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
							{ hasMyPatterns && (
								<ItemGroup className="edit-site-sidebar-navigation-screen-patterns__group">
									<CategoryItem
										key={ myPatterns.name }
										count={ myPatterns.count }
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
							) }
							{ hasTemplateParts && (
								<ItemGroup className="edit-site-sidebar-navigation-screen-patterns__group">
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
												id={ area }
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
								<ItemGroup className="edit-site-sidebar-navigation-screen-patterns__group">
									{ patternCategories.map( ( category ) => (
										<CategoryItem
											key={ category.name }
											count={ category.count }
											label={
												<Flex
													justify="left"
													align="center"
													gap={ 0 }
												>
													{ category.label }
													<Tooltip
														position="top center"
														text={ __(
															'Theme patterns cannot be edited.'
														) }
													>
														<span className="edit-site-sidebar-navigation-screen-pattern__lock-icon">
															<Icon
																style={ {
																	fill: 'currentcolor',
																} }
																icon={
																	lockSmall
																}
																size={ 24 }
															/>
														</span>
													</Tooltip>
												</Flex>
											}
											icon={ file }
											id={ category.name }
											type="pattern"
											isActive={
												currentCategory ===
													`${ category.name }` &&
												currentType === 'pattern'
											}
										/>
									) ) }
								</ItemGroup>
							) }
						</>
					) }
				</>
			}
		/>
	);
}

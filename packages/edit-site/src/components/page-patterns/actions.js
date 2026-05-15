/**
 * WordPress dependencies
 */
import { DropdownMenu, MenuGroup } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { moreVertical } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import AddNewPattern from '../add-new-pattern';
import RenameCategoryMenuItem from './rename-category-menu-item';
import DeleteCategoryMenuItem from './delete-category-menu-item';
import usePatternCategories from '../sidebar-navigation-screen-patterns/use-pattern-categories';
import { PATTERN_TYPES } from '../../utils/constants';

export default function PatternsActions( { categoryId, type } ) {
	const { patternCategories } = usePatternCategories();
	let patternCategory;
	if ( type === PATTERN_TYPES.user && !! categoryId ) {
		patternCategory = patternCategories.find(
			( category ) => category.name === categoryId
		);
	}

	return (
		<>
			<AddNewPattern />
			{ !! patternCategory?.id && (
				<DropdownMenu
					icon={ moreVertical }
					label={ __( 'Actions' ) }
					toggleProps={ {
						className: 'edit-site-patterns__button',
						size: 'compact',
					} }
				>
					{ ( { onClose } ) => (
						<MenuGroup>
							<RenameCategoryMenuItem
								category={ patternCategory }
								onClose={ onClose }
							/>
							<DeleteCategoryMenuItem
								category={ patternCategory }
								onClose={ onClose }
							/>
						</MenuGroup>
					) }
				</DropdownMenu>
			) }
		</>
	);
}

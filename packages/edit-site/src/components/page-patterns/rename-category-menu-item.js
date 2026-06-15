/**
 * WordPress dependencies
 */
import { MenuItem } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { privateApis as patternsPrivateApis } from '@wordpress/patterns';
/**
 * Internal dependencies
 */
import usePatternCategories from '../sidebar-navigation-screen-patterns/use-pattern-categories';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const { RenamePatternCategoryModal } = unlock( patternsPrivateApis );

export default function RenameCategoryMenuItem( { category, onClose } ) {
	const [ isModalOpen, setIsModalOpen ] = useState( false );

	return (
		<>
			<MenuItem onClick={ () => setIsModalOpen( true ) }>
				{ __( 'Rename' ) }
			</MenuItem>
			{ isModalOpen && (
				<RenameModal
					category={ category }
					onClose={ () => {
						setIsModalOpen( false );
						onClose();
					} }
				/>
			) }
		</>
	);
}

function RenameModal( { category, onClose } ) {
	// User created pattern categories have their properties updated when
	// retrieved via `getUserPatternCategories`. The rename modal expects an
	// object that will match the pattern category entity.
	const normalizedCategory = {
		id: category.id,
		slug: category.slug,
		name: category.label,
	};

	// Optimization - only use pattern categories when the modal is open.
	const existingCategories = usePatternCategories();

	return (
		<RenamePatternCategoryModal
			category={ normalizedCategory }
			existingCategories={ existingCategories }
			onClose={ onClose }
			overlayClassName="edit-site-list__rename-modal"
			focusOnMount="firstContentElement"
			size="small"
		/>
	);
}

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
import { unlock } from '../../lock-unlock';

const { RenamePatternCategoryModal } = unlock( patternsPrivateApis );

export default function RenameCategoryMenuItem( { category, onClose } ) {
	const [ isModalOpen, setIsModalOpen ] = useState( false );

	if ( ! category?.id ) {
		return null;
	}

	return (
		<>
			<MenuItem onClick={ () => setIsModalOpen( true ) }>
				{ __( 'Rename' ) }
			</MenuItem>
			{ isModalOpen && (
				<RenamePatternCategoryModal
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

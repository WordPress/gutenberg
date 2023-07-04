/**
 * WordPress dependencies
 */
import { MenuItem } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { privateApis as routerPrivateApis } from '@wordpress/router';

/**
 * Internal dependencies
 */
import CreatePatternModal from '../create-pattern-modal';
import CreateTemplatePartModal from '../create-template-part-modal';
import { TEMPLATE_PARTS, USER_PATTERNS } from './utils';
import { unlock } from '../../lock-unlock';

const { useHistory } = unlock( routerPrivateApis );

export default function DuplicateMenuItem( { item, onClose } ) {
	const history = useHistory();
	const [ isModalOpen, setIsModalOpen ] = useState( false );

	function handleCreatePattern( { pattern, categoryId } ) {
		setIsModalOpen( false );
		onClose();

		history.push( {
			postId: pattern.id,
			postType: 'wp_block',
			categoryType: 'wp_block',
			categoryId,
			canvas: 'edit',
		} );
	}

	function handleCreateTemplatePart( templatePart ) {
		setIsModalOpen( false );
		onClose();

		// Navigate to the created template part editor.
		history.push( {
			postId: templatePart.id,
			postType: 'wp_template_part',
			canvas: 'edit',
		} );
	}

	function handleError() {
		setIsModalOpen( false );
		onClose();
	}

	return (
		<>
			<MenuItem onClick={ () => setIsModalOpen( true ) }>
				{ __( 'Duplicate' ) }
			</MenuItem>
			{ isModalOpen && item.type === USER_PATTERNS && (
				<CreatePatternModal
					closeModal={ () => setIsModalOpen( false ) }
					onCreate={ handleCreatePattern }
					onError={ handleError }
					blocks={ item.blocks || [] }
					title={ __( 'Duplicate pattern' ) }
				/>
			) }
			{ isModalOpen && item.type === TEMPLATE_PARTS && (
				<CreateTemplatePartModal
					closeModal={ () => setIsModalOpen( false ) }
					blocks={ item.blocks || [] }
					onCreate={ handleCreateTemplatePart }
					onError={ handleError }
				/>
			) }
		</>
	);
}

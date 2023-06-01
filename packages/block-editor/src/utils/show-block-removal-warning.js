/**
 * WordPress dependencies
 */
import {
	Modal,
	Button,
	__experimentalHStack as HStack,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';

export function showBlockRemovalWarning( blockName ) {
	if ( blockName === 'core/query' || blockName === 'core/post-content' ) {
		return blockName;
	}
	return false;
}

export function BlockRemovalWarningModal( {
	blockName,
	closeModal,
	removalFunction,
} ) {
	const message =
		blockName === 'core/post-content'
			? __(
					'This block displays the content of a post or page. Removing it it is not advised.'
			  )
			: __(
					'This block displays a list of posts. Removing it is not advised.'
			  );
	const onConfirmRemoval = () => {
		removalFunction();
		closeModal();
	};
	return (
		<Modal
			title={ sprintf(
				/* translators: %s: the name of a menu to delete */
				__( 'Remove %s?' ),
				blockName
			) }
			onRequestClose={ () => closeModal() }
		>
			<p>{ message }</p>
			<HStack justify="right">
				<Button variant="tertiary" onClick={ () => closeModal() }>
					{ __( 'Cancel' ) }
				</Button>
				<Button variant="primary" onClick={ () => onConfirmRemoval() }>
					{ __( 'Confirm' ) }
				</Button>
			</HStack>
		</Modal>
	);
}

/**
 * WordPress dependencies
 */
import {
	Button,
	Modal,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useUnsupportedBlockList } from '../utils';

const disableEnhancedPaginationDescription = __(
	'You have added unsupported blocks. For the enhanced pagination to work, remove them, then re-enable "Enhanced pagination" in the Query Block settings.'
);

const modalDescriptionId =
	'wp-block-query-enhanced-pagination-modal__description';

export default function EnhancedPaginationModal( {
	clientId,
	attributes: { enhancedPagination },
	setAttributes,
} ) {
	const [ isOpen, setOpen ] = useState( false );

	const unsupported = useUnsupportedBlockList( clientId );

	useEffect( () => {
		setOpen( !! unsupported.length && enhancedPagination );
	}, [ unsupported.length, enhancedPagination, setOpen ] );

	return (
		isOpen && (
			<Modal
				title={ __( 'Enhanced pagination will be disabled' ) }
				className="wp-block-query__enhanced-pagination-modal"
				aria={ {
					describedby: modalDescriptionId,
				} }
				role="alertdialog"
				focusOnMount="firstElement"
				isDismissible={ false }
				shouldCloseOnEsc={ false }
				shouldCloseOnClickOutside={ false }
			>
				<VStack alignment="right" spacing={ 5 }>
					<span id={ modalDescriptionId }>
						{ disableEnhancedPaginationDescription }
					</span>
					<Button
						variant="primary"
						onClick={ () => {
							setAttributes( { enhancedPagination: false } );
						} }
					>
						{ __( 'OK' ) }
					</Button>
				</VStack>
			</Modal>
		)
	);
}

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
import { useContainsThirdPartyBlocks } from '../utils';

const disableEnhancedPaginationDescription = __(
	'Plugin blocks are not supported yet. For the enhanced pagination to work, remove the plugin block, then re-enable "Enhanced pagination" in the Query Block settings.'
);

const modalDescriptionId =
	'wp-block-query-enhanced-pagination-modal__description';

export default function EnhancedPaginationModal( {
	clientId,
	attributes: { enhancedPagination },
	setAttributes,
} ) {
	const [ isOpen, setOpen ] = useState( false );

	const containsThirdPartyBlocks = useContainsThirdPartyBlocks( clientId );

	useEffect( () => {
		setOpen( containsThirdPartyBlocks && enhancedPagination );
	}, [ containsThirdPartyBlocks, enhancedPagination, setOpen ] );

	return (
		isOpen && (
			<Modal
				title={ __( 'Enhanced pagination will be disabled' ) }
				className="wp-block-query__enhanced-pagination-modal"
				aria={ {
					describedby: modalDescriptionId,
				} }
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

/**
 * WordPress dependencies
 */
import { useDispatch } from '@wordpress/data';
import {
	Button,
	Modal,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useContainsThirdPartyBlocks } from '../utils';

const disableEnhancedPaginationDescription = __(
	'Third-party blocks are not supported inside a Query Loop block with enhanced pagination enabled.'
);

const modalDescriptionId =
	'wp-block-query-enhanced-pagination-modal__description';

export default function EnhancedPaginationModal( {
	clientId,
	attributes: { enhancedPagination },
	setAttributes,
} ) {
	const containsThirdPartyBlocks = useContainsThirdPartyBlocks( clientId );

	// eslint-disable-next-line @wordpress/data-no-store-string-literals
	const { undo } = useDispatch( 'core/editor' );

	return (
		containsThirdPartyBlocks &&
		enhancedPagination && (
			<Modal
				title={ __( "Disable Query Loop's enhanced pagination?" ) }
				className={ 'wp-block-query-enhanced-pagination-modal' }
				aria={ {
					describedby: modalDescriptionId,
				} }
				isDismissible={ false }
				shouldCloseOnEsc={ false }
				shouldCloseOnClickOutside={ false }
			>
				<p id={ modalDescriptionId }>
					{ disableEnhancedPaginationDescription }
				</p>
				<VStack alignment="right" spacing={ 3 }>
					<Button
						variant="primary"
						onClick={ () => {
							setAttributes( { enhancedPagination: false } );
						} }
					>
						{ __( 'Disable it and keep third-party blocks' ) }
					</Button>
					<Button variant="tertiary" onClick={ undo }>
						{ __( 'Undo changes' ) }
					</Button>
				</VStack>
			</Modal>
		)
	);
}

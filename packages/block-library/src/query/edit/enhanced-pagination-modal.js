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
import {
	useHasBlocksFromPlugins,
	useHasPostContentBlock,
	useHasPatternsOrTemplateParts,
} from '../utils';

const modalDescriptionId =
	'wp-block-query-enhanced-pagination-modal__description';

export default function EnhancedPaginationModal( {
	clientId,
	attributes: { enhancedPagination },
	setAttributes,
} ) {
	const [ isOpen, setOpen ] = useState( false );

	const hasBlocksFromPlugins = useHasBlocksFromPlugins( clientId );
	const hasPostContentBlock = useHasPostContentBlock( clientId );
	const hasSyncedBlocks = useHasPatternsOrTemplateParts( clientId );

	useEffect( () => {
		setOpen(
			false &&
				enhancedPagination &&
				( hasBlocksFromPlugins || hasPostContentBlock )
		);
	}, [ enhancedPagination, hasBlocksFromPlugins, hasPostContentBlock ] );

	useEffect( () => {
		if (
			enhancedPagination &&
			( hasBlocksFromPlugins || hasPostContentBlock )
		) {
			setAttributes( { enhancedPagination: false } );
		}
	}, [ enhancedPagination, hasBlocksFromPlugins, hasPostContentBlock ] );

	let notice = null;
	if ( hasBlocksFromPlugins ) {
		notice =
			'Blocks from plugins are not supported yet. For the enhanced pagination to work, remove the blocks, then re-enable "Enhanced pagination" in the Query Block settings.';
	} else if ( hasPostContentBlock ) {
		notice = __(
			'The Post Content block is not supported yet. For the enhanced pagination to work, remove the block, then re-enable "Enhanced pagination" in the Query Block settings.'
		);
	} else if ( enhancedPagination && hasSyncedBlocks ) {
		notice = __(
			'Blocks from plugins are not supported yet. Please note that if you add them to the patterns or template parts that are currently inside this Query block, this enhanced pagination will be automatically disabled.'
		);
	}

	return (
		isOpen && (
			<Modal
				title={ __( 'Enhanced pagination has been disabled' ) }
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
					<span id={ modalDescriptionId }>{ notice }</span>
					<Button
						variant="primary"
						onClick={ () => {
							setOpen( false );
						} }
					>
						{ __( 'OK' ) }
					</Button>
				</VStack>
			</Modal>
		)
	);
}

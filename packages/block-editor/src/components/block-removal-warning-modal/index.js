/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import {
	Modal,
	Button,
	__experimentalHStack as HStack,
} from '@wordpress/components';
import { __, _n } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';

export function BlockRemovalWarningModal( { rules } ) {
	const { clientIds, selectPrevious, blockNamesForPrompt, messageType } =
		useSelect( ( select ) =>
			unlock( select( blockEditorStore ) ).getRemovalPromptData()
		);

	const {
		clearBlockRemovalPrompt,
		setBlockRemovalRules,
		privateRemoveBlocks,
	} = unlock( useDispatch( blockEditorStore ) );

	// Load block removal rules, simultaneously signalling that the block
	// removal prompt is in place.
	useEffect( () => {
		setBlockRemovalRules( rules );
		return () => {
			setBlockRemovalRules();
		};
	}, [ rules, setBlockRemovalRules ] );

	if ( ! blockNamesForPrompt ) {
		return;
	}

	const message =
		messageType === 'templates'
			? _n(
					'Deleting this block will stop your post or page content from displaying on this template. It is not recommended.',
					'Deleting these blocks will stop your post or page content from displaying on this template. It is not recommended.',
					blockNamesForPrompt.length
			  )
			: _n(
					'Deleting this block could break patterns on your site that have content linked to it. Are you sure you want to delete it?',
					'Deleting these blocks could break patterns on your site that have content linked to them. Are you sure you want to delete them?',
					blockNamesForPrompt.length
			  );

	const onConfirmRemoval = () => {
		privateRemoveBlocks( clientIds, selectPrevious, /* force */ true );
		clearBlockRemovalPrompt();
	};

	return (
		<Modal
			title={ __( 'Be careful!' ) }
			onRequestClose={ clearBlockRemovalPrompt }
			size="medium"
		>
			<p>{ message }</p>
			<HStack justify="right">
				<Button variant="tertiary" onClick={ clearBlockRemovalPrompt }>
					{ __( 'Cancel' ) }
				</Button>
				<Button variant="primary" onClick={ onConfirmRemoval }>
					{ __( 'Delete' ) }
				</Button>
			</HStack>
		</Modal>
	);
}

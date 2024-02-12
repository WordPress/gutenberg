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
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';

export function BlockRemovalWarningModal( { rules } ) {
	const { clientIds, selectPrevious, ruleKeysForPrompt } = useSelect(
		( select ) =>
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

	if ( ! ruleKeysForPrompt ) {
		return;
	}

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
			<ul>
				{ ruleKeysForPrompt.map( ( ruleKey ) => {
					if ( rules[ ruleKey ]?.message ) {
						return (
							<li key={ ruleKey }>
								{ rules[ ruleKey ].message }
							</li>
						);
					}
					return null;
				} ) }
			</ul>
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

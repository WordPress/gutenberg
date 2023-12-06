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
	const { clientIds, selectPrevious, blockNamesForPrompt } = useSelect(
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

	if ( ! blockNamesForPrompt ) {
		return;
	}

	const onConfirmRemoval = () => {
		privateRemoveBlocks( clientIds, selectPrevious, /* force */ true );
		clearBlockRemovalPrompt();
	};

	return (
		<Modal
			title={ __( 'Are you sure?' ) }
			onRequestClose={ clearBlockRemovalPrompt }
		>
			{ blockNamesForPrompt.length === 1 ? (
				<p>
					{ rules[ blockNamesForPrompt[ 0 ] ] }{ ' ' }
					{ __(
						"Be careful! Post or page content will not be displayed if you delete this block."
					) }{ ' ' }
				</p>
			) : (
				<>
					<ul
						style={ { listStyleType: 'disc', paddingLeft: '1rem' } }
					>
						{ blockNamesForPrompt.map( ( name ) => (
							<li key={ name }>{ rules[ name ] }</li>
						) ) }
					</ul>
					<p>
						{ ' ' }
						{ __(
							"Be careful! Post or page content will not be displayed if you delete these blocks."
						) }
					</p>
				</>
			) }

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

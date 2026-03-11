/* @jsx createElement */

/**
 * WordPress dependencies
 */
import {
	Button,
	Modal,
	__experimentalVStack as VStack,
	__experimentalHStack as HStack,
	__experimentalText as Text,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { createElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import './remove-guideline-confirmation.scss';

interface RemoveGuidelineConfirmationProps {
	title: string;
	onClose: () => void;
	onConfirm: () => void;
	isBusy?: boolean;
	children: React.ReactNode;
	actionLabel?: string;
}

export default function RemoveGuidelineConfirmation( {
	title,
	onClose,
	onConfirm,
	isBusy = false,
	children,
	actionLabel = __( 'Remove' ),
}: RemoveGuidelineConfirmationProps ) {
	return (
		<Modal
			className="remove-guideline-confirmation"
			title={ title }
			onRequestClose={ onClose }
			size="small"
		>
			<VStack spacing={ 6 }>
				<VStack spacing={ 4 }>
					<Text size={ 13 } weight={ 400 }>
						{ children }
					</Text>
				</VStack>
				<HStack justify="flex-end">
					<Button
						variant="tertiary"
						onClick={ onClose }
						disabled={ isBusy }
						accessibleWhenDisabled
					>
						{ __( 'Cancel' ) }
					</Button>
					<Button
						disabled={ isBusy }
						accessibleWhenDisabled
						isBusy={ isBusy }
						variant="primary"
						onClick={ onConfirm }
						isDestructive
						__next40pxDefaultSize
					>
						{ actionLabel }
					</Button>
				</HStack>
			</VStack>
		</Modal>
	);
}

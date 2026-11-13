import type { ReactNode } from 'react';
import { Modal } from '@wordpress/components';
import {
	// eslint-disable-next-line @wordpress/use-recommended-components -- Migrate the media picker while keeping its legacy fallback.
	Dialog,
} from '@wordpress/ui';

interface Props {
	children: ReactNode;
	headerActions: ReactNode;
	open: boolean;
	title: string;
	className: string;
	isDismissible: boolean;
	onClose: () => void;
	useUiOverlay: boolean;
}

/** Keep the legacy host when the supplied Components cannot use UI overlays. */
export function MediaPickerDialog( {
	children,
	headerActions,
	open,
	title,
	className,
	isDismissible,
	onClose,
	useUiOverlay,
}: Props ) {
	if ( ! useUiOverlay ) {
		return open ? (
			<Modal
				title={ title }
				className={ className }
				size="fill"
				headerActions={ headerActions }
				isDismissible={ isDismissible }
				onRequestClose={ onClose }
			>
				{ children }
			</Modal>
		) : null;
	}
	return (
		<Dialog.Root
			open={ open }
			onOpenChange={ ( nextOpen, details ) => {
				if ( ! nextOpen ) {
					if ( ! isDismissible ) {
						details.cancel();
						return;
					}
					onClose();
				}
			} }
		>
			<Dialog.Popup size="full" className={ className }>
				<Dialog.Header>
					<Dialog.Title>{ title }</Dialog.Title>
					{ headerActions }
					{ isDismissible && <Dialog.CloseIconButton /> }
				</Dialog.Header>
				{ children }
			</Dialog.Popup>
		</Dialog.Root>
	);
}

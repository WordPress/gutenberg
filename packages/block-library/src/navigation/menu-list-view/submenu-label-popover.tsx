import { Button, Popover as WCPopover } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { InputControl, Stack } from '@wordpress/ui';

/**
 * Asks for the label of a new label-only submenu (#86936), in a popover beside
 * its row, as in the Create Not Learn prototype.
 *
 * @param props          Component props.
 * @param props.anchor   The new submenu's row.
 * @param props.onSubmit Called with the trimmed label.
 * @param props.onCancel Called when it closes without adding.
 */
export default function SubmenuLabelPopover( {
	anchor,
	onSubmit,
	onCancel,
}: {
	anchor: Element | null | undefined;
	onSubmit: ( label: string ) => void;
	onCancel: () => void;
} ) {
	const [ label, setLabel ] = useState( '' );
	const trimmedLabel = label.trim();

	return (
		<WCPopover
			anchor={ anchor }
			placement="bottom-start"
			onClose={ onCancel }
			focusOnMount="firstElement"
			className="navigation-menu-appender__label-popover"
		>
			<form
				style={ {
					boxSizing: 'border-box',
					width: 280,
					padding: 'var(--wpds-dimension-padding-lg, 16px)',
				} }
				onSubmit={ ( event ) => {
					event.preventDefault();
					if ( trimmedLabel ) {
						onSubmit( trimmedLabel );
					}
				} }
			>
				<Stack direction="column" gap="lg">
					<InputControl
						label={ __( 'Submenu label' ) }
						description={ __(
							'It opens the submenu and doesn’t link anywhere.'
						) }
						autoComplete="off"
						value={ label }
						onValueChange={ setLabel }
						required
					/>
					<Stack direction="row" justify="flex-end" gap="sm">
						<Button
							__next40pxDefaultSize
							variant="tertiary"
							onClick={ onCancel }
						>
							{ __( 'Cancel' ) }
						</Button>
						<Button
							__next40pxDefaultSize
							variant="primary"
							type="submit"
							accessibleWhenDisabled
							disabled={ ! trimmedLabel }
						>
							{ __( 'Add submenu' ) }
						</Button>
					</Stack>
				</Stack>
			</form>
		</WCPopover>
	);
}

import { Button, Modal } from '@wordpress/components';
import { CheckboxControl, InputControl, Stack } from '@wordpress/ui';
import { store as coreStore } from '@wordpress/core-data';
import { useDispatch } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';

// A menu that lists every page, and keeps up as pages are published.
const AUTO_MENU_CONTENT = '<!-- wp:page-list /-->';

/**
 * Creates a menu: one that lists every page (an Auto menu), unless that's
 * unticked, in which case it starts empty.
 *
 * @param props
 * @param props.onClose   Closes the modal.
 * @param props.onCreated Called with the new menu's ID.
 */
export default function AddMenuModal( {
	onClose,
	onCreated,
}: {
	onClose: () => void;
	onCreated: ( id: number ) => void;
} ) {
	const [ title, setTitle ] = useState( '' );
	const [ includePages, setIncludePages ] = useState( true );
	const [ isBusy, setIsBusy ] = useState( false );
	const { saveEntityRecord } = useDispatch( coreStore );
	const { createSuccessNotice, createErrorNotice } =
		useDispatch( noticesStore );

	const close = () => {
		if ( ! isBusy ) {
			onClose();
		}
	};

	const submit = async ( event: { preventDefault: () => void } ) => {
		event.preventDefault();
		const trimmedTitle = title.trim();
		if ( ! trimmedTitle ) {
			return;
		}
		setIsBusy( true );
		try {
			const record = ( await saveEntityRecord(
				'postType',
				'wp_navigation',
				{
					title: trimmedTitle,
					status: 'publish',
					content: includePages ? AUTO_MENU_CONTENT : '',
				},
				{ throwOnError: true }
			) ) as { id?: number } | undefined;
			createSuccessNotice( __( 'Menu created.' ), { type: 'snackbar' } );
			onClose();
			if ( record?.id ) {
				onCreated( record.id );
			}
		} catch ( error ) {
			createErrorNotice(
				sprintf(
					/* translators: %s: Why the menu couldn't be created. */
					__( 'Unable to create menu: %s' ),
					( error as { message?: string } )?.message ??
						__( 'Unknown error' )
				),
				{ type: 'snackbar' }
			);
			setIsBusy( false );
		}
	};

	return (
		<Modal
			title={ __( 'Add menu' ) }
			onRequestClose={ close }
			focusOnMount="firstContentElement"
			size="small"
		>
			<form onSubmit={ submit }>
				<Stack direction="column" gap="lg">
					<InputControl
						autoComplete="off"
						label={ __( 'Name' ) }
						placeholder={ __( 'Enter menu name' ) }
						value={ title }
						onValueChange={ setTitle }
						disabled={ isBusy }
					/>
					<CheckboxControl
						label={ __( 'Automatically include all new pages' ) }
						description={ __(
							'The menu lists your pages, and new pages are added as you publish them. You can customize it later.'
						) }
						checked={ includePages }
						onCheckedChange={ setIncludePages }
						disabled={ isBusy }
					/>
					<Stack direction="row" justify="flex-end" gap="sm">
						<Button
							__next40pxDefaultSize
							variant="tertiary"
							onClick={ close }
							disabled={ isBusy }
							accessibleWhenDisabled
						>
							{ __( 'Cancel' ) }
						</Button>
						<Button
							__next40pxDefaultSize
							variant="primary"
							type="submit"
							aria-busy={ isBusy }
							disabled={ isBusy || ! title.trim() }
							accessibleWhenDisabled
						>
							{ __( 'Create menu' ) }
						</Button>
					</Stack>
				</Stack>
			</form>
		</Modal>
	);
}

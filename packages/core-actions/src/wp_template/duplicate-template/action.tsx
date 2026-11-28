import { paramCase as kebabCase } from 'change-case';
import { useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { __, _x, sprintf } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { useState } from '@wordpress/element';
import {
	Button,
	TextControl,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import type {
	CoreDataError,
	Template,
	ActionScriptParts,
} from '../../shared/types';
import { getItemTitle, isTemplateRemovable } from '../../shared/utils';

/**
 * This action is used to duplicate a custom template. The theme's templates,
 * such as `index` or `single`, are not duplicated: there can only be one of
 * each.
 */
const duplicateTemplate: ActionScriptParts< Template > = {
	isEligible: ( item ) =>
		item.type === 'wp_template' &&
		item.status !== 'trash' &&
		item.is_custom &&
		isTemplateRemovable( item ),
	RenderModal: ( { items, closeModal, onActionPerformed } ) => {
		const [ item ] = items;
		const [ title, setTitle ] = useState< string >( () =>
			sprintf(
				/* translators: %s: Existing template title */
				_x( '%s (Copy)', 'template' ),
				getItemTitle( item )
			)
		);
		const [ isBusy, setIsBusy ] = useState( false );
		const { saveEntityRecord } = useDispatch( coreStore );
		const { createSuccessNotice, createErrorNotice } =
			useDispatch( noticesStore );

		async function onDuplicate( event: React.FormEvent ) {
			event.preventDefault();
			if ( isBusy ) {
				return;
			}
			setIsBusy( true );
			try {
				// A registered post type saved with `throwOnError` returns the template.
				const newItem = ( await saveEntityRecord(
					'postType',
					'wp_template',
					{
						// Like the custom templates the site editor adds.
						slug: kebabCase( title ) || 'wp-custom-template',
						title,
						description: item.description,
						content:
							typeof item.content === 'string'
								? item.content
								: item.content.raw,
						status: 'publish',
						// Keeps the copy a custom template.
						is_wp_suggestion: false,
					},
					{ throwOnError: true }
				) ) as unknown as Template;

				createSuccessNotice(
					sprintf(
						// translators: %s: The new template's title e.g. 'Landing page (Copy)'.
						_x( '"%s" duplicated.', 'template' ),
						getItemTitle( newItem )
					),
					{ type: 'snackbar', id: 'duplicate-template-action' }
				);
				onActionPerformed?.( [ newItem ] );
			} catch ( error ) {
				const typedError = error as CoreDataError;
				const errorMessage =
					typedError.message && typedError.code !== 'unknown_error'
						? typedError.message
						: __(
								'An error occurred while duplicating the template.'
							);
				createErrorNotice( errorMessage, { type: 'snackbar' } );
			} finally {
				setIsBusy( false );
				closeModal?.();
			}
		}

		return (
			<form onSubmit={ onDuplicate }>
				<VStack spacing="5">
					<TextControl
						label={ __( 'Name' ) }
						value={ title }
						onChange={ setTitle }
						disabled={ isBusy }
						required
					/>
					<HStack justify="right">
						<Button
							__next40pxDefaultSize
							variant="tertiary"
							onClick={ () => {
								closeModal?.();
							} }
						>
							{ __( 'Cancel' ) }
						</Button>
						<Button
							__next40pxDefaultSize
							variant="primary"
							type="submit"
							isBusy={ isBusy }
							aria-disabled={ isBusy }
						>
							{ _x( 'Duplicate', 'action label' ) }
						</Button>
					</HStack>
				</VStack>
			</form>
		);
	},
};

/**
 * The JavaScript parts of the duplicate action for Template; its data is in
 * `action.php`.
 */
export default duplicateTemplate;

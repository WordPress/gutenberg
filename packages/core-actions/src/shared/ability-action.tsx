/**
 * Builds the UI of an action from an ability.
 *
 * The ability does the work; the action only maps the items it is triggered on
 * to the input of the ability. Whatever input the items do not provide is
 * asked for in a form generated from the `input_schema` of the ability. When
 * the items provide all of it, the modal asks for a confirmation instead.
 */

import { executeAbility, getAbility } from '@wordpress/abilities';
import type { Ability } from '@wordpress/abilities';
import { useDispatch } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { Button } from '@wordpress/components';
import { InputControl, Stack, Text } from '@wordpress/ui';
import type { ActionModal, RenderModalProps } from '@wordpress/dataviews';
import type { CoreDataError } from './types';

type Input = Record< string, unknown >;

export interface AbilityActionOptions< Item, Output > {
	/**
	 * The name of the ability performing the action.
	 */
	ability: string;
	/**
	 * The part of the input the items provide, such as their ids.
	 */
	getInput: ( items: Item[] ) => Input;
	/**
	 * The initial values of the fields asked for in the form.
	 */
	getInitialValues?: ( items: Item[] ) => Input;
	/**
	 * The text asking to confirm the action, when there is no form.
	 */
	getConfirmation?: ( items: Item[] ) => string;
	/**
	 * The label of the button running the ability. Defaults to the label of
	 * the ability.
	 */
	submitLabel?: string;
	/**
	 * The snackbar shown when the ability runs. Return `null` to show none,
	 * such as when `getErrorMessage` reports a partial failure instead.
	 */
	getSuccessMessage: ( items: Item[], output: Output ) => string | null;
	/**
	 * The snackbar shown for an output reporting a failure.
	 */
	getErrorMessage?: ( items: Item[], output: Output ) => string | null;
	/**
	 * The message shown when the ability throws without one of its own.
	 */
	fallbackErrorMessage: string;
	/**
	 * The id of the success notice, so repeated runs replace it.
	 */
	noticeId?: string;
}

interface FormField {
	name: string;
	label: string;
	required: boolean;
}

/**
 * The fields of the input schema that the items do not provide.
 *
 * Only string properties are supported for now: the other types fall back to
 * the input of the items or fail the input validation.
 *
 * @param ability  The ability.
 * @param provided The input the items provide.
 * @return The fields to ask for.
 */
export function getFormFields(
	ability: Ability | undefined,
	provided: Input
): FormField[] {
	const schema = ability?.input_schema;
	if ( ! schema || schema.type !== 'object' || ! schema.properties ) {
		return [];
	}
	const required: string[] = schema.required ?? [];
	return Object.entries(
		schema.properties as Record< string, Record< string, any > >
	)
		.filter(
			( [ name, property ] ) =>
				! ( name in provided ) && property.type === 'string'
		)
		.map( ( [ name, property ] ) => ( {
			name,
			label: property.title ?? property.description ?? name,
			required: required.includes( name ),
		} ) );
}

function getThrownMessage( error: unknown, fallback: string ) {
	const { message, code } = ( error ?? {} ) as CoreDataError;
	return message && code !== 'unknown_error' ? message : fallback;
}

/**
 * Returns the `RenderModal` of an action performed by an ability.
 *
 * @param options The options.
 * @return The JavaScript parts of the action to merge with its server data.
 */
export function createAbilityAction< Item, Output = any >(
	options: AbilityActionOptions< Item, Output >
): Pick< ActionModal< Item >, 'RenderModal' > {
	function RenderModal( {
		items,
		closeModal,
		onActionPerformed,
	}: RenderModalProps< Item > ) {
		const ability = getAbility( options.ability );
		const provided = options.getInput( items );
		const fields = getFormFields( ability, provided );
		const [ values, setValues ] = useState< Input >(
			() => options.getInitialValues?.( items ) ?? {}
		);
		const [ isBusy, setIsBusy ] = useState( false );
		const { createSuccessNotice, createErrorNotice } =
			useDispatch( noticesStore );

		async function onSubmit( event: React.FormEvent ) {
			event.preventDefault();
			setIsBusy( true );
			try {
				const input = { ...values, ...provided };
				const output: Output = await executeAbility(
					options.ability,
					input
				);
				const errorMessage = options.getErrorMessage?.( items, output );
				if ( errorMessage ) {
					createErrorNotice( errorMessage, { type: 'snackbar' } );
				}
				const successMessage = options.getSuccessMessage(
					items,
					output
				);
				if ( successMessage ) {
					createSuccessNotice( successMessage, {
						type: 'snackbar',
						id: options.noticeId,
					} );
				}
				onActionPerformed?.( items );
			} catch ( error ) {
				createErrorNotice(
					getThrownMessage( error, options.fallbackErrorMessage ),
					{ type: 'snackbar' }
				);
			}
			setIsBusy( false );
			closeModal?.();
		}

		return (
			<form onSubmit={ onSubmit }>
				<Stack direction="column" gap="lg">
					{ fields.length === 0 && options.getConfirmation && (
						<Text>{ options.getConfirmation( items ) }</Text>
					) }
					{ fields.map( ( field ) => (
						<InputControl
							key={ field.name }
							label={ field.label }
							value={ ( values[ field.name ] as string ) ?? '' }
							onValueChange={ ( value ) =>
								setValues( ( current ) => ( {
									...current,
									[ field.name ]: value,
								} ) )
							}
							required={ field.required }
						/>
					) ) }
					<Stack direction="row" justify="flex-end" gap="sm">
						<Button
							__next40pxDefaultSize
							variant="tertiary"
							onClick={ closeModal }
							disabled={ isBusy }
							accessibleWhenDisabled
						>
							{ __( 'Cancel' ) }
						</Button>
						<Button
							__next40pxDefaultSize
							variant="primary"
							type="submit"
							isBusy={ isBusy }
							disabled={ isBusy }
							accessibleWhenDisabled
						>
							{ options.submitLabel ?? ability?.label }
						</Button>
					</Stack>
				</Stack>
			</form>
		);
	}

	return { RenderModal };
}

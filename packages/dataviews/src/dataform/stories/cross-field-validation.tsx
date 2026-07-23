/**
 * WordPress dependencies
 */
import { useMemo, useState } from '@wordpress/element';
import { Button } from '@wordpress/components';
import { Stack } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import DataForm from '../index';
import useFormValidity from '../../hooks/use-form-validity';
import type { Field, Form } from '../../types';

type Credentials = {
	password: string;
	confirmPassword: string;
};

/**
 * A cross-field validator: `confirmPassword` is only valid when it matches
 * `password`. Note that it reads a field (`password`) other than its own.
 */
const confirmMatchesPassword = ( value: Credentials ) => {
	if ( value.confirmPassword !== value.password ) {
		return 'Does not match the password.';
	}
	return null;
};

const fields: Field< Credentials >[] = [
	{
		id: 'password',
		type: 'text',
		label: 'Password',
	},
	{
		id: 'confirmPassword',
		type: 'text',
		label: 'Confirm password',
		isValid: {
			custom: confirmMatchesPassword,
		},
	},
];

function CredentialsForm( {
	form,
	description,
}: {
	form: Form;
	description: string;
} ) {
	const [ data, setData ] = useState< Credentials >( {
		password: 'secret',
		confirmPassword: 'secret',
	} );

	const { validity, isValid } = useFormValidity( data, fields, form );

	return (
		<Stack direction="column" align="start" gap="md">
			<p style={ { maxWidth: '32ch', margin: 0 } }>{ description }</p>
			<DataForm< Credentials >
				data={ data }
				fields={ fields }
				form={ form }
				validity={ validity }
				onChange={ ( edits ) =>
					setData( ( prev ) => ( { ...prev, ...edits } ) )
				}
			/>
			<Button
				__next40pxDefaultSize
				accessibleWhenDisabled
				disabled={ ! isValid }
				variant="primary"
			>
				{ isValid ? 'Valid ✓' : 'Invalid ✗' }
			</Button>
		</Stack>
	);
}

/**
 * Demonstrates how DataForm's per-field re-validation interacts with a
 * validator that reads *another* field.
 *
 * `useFormValidity` skips a top-level form field when the value it tracks for
 * that field is unchanged. The tracked value is whatever
 * `getFormFieldValue` returns:
 *
 * - For a leaf top-level field it is that field's own value only.
 * - For a *combined* top-level field it is `{ value, children }`, i.e. it
 *   includes every descendant's value.
 *
 * This produces two very different behaviors for the exact same
 * cross-field validator:
 *
 * 1. LEFT (goes stale) — `password` and `confirmPassword` are two separate
 *    top-level fields. Start from the matching values, then edit `password`.
 *    `confirmPassword`'s own value did not change, so its validator is skipped
 *    and its "matches password" result goes stale: the form still reports
 *    valid even though the values no longer match. This is the case the
 *    "we re-run validators ourselves" workaround exists for.
 *
 * 2. RIGHT (stays fresh — the counter-example) — the same two fields are
 *    grouped under a single combined field. Because the combined field's
 *    tracked value includes both children, editing `password` changes that
 *    value, the combined field is *not* skipped, and DataForm re-runs the
 *    `confirmPassword` validator on its own — no workaround needed. Edit
 *    `password` and the mismatch error appears immediately.
 */
const CrossFieldValidationComponent = () => {
	const staleForm: Form = useMemo(
		() => ( {
			fields: [ 'password', 'confirmPassword' ],
		} ),
		[]
	);

	const freshForm: Form = useMemo(
		() => ( {
			fields: [
				{
					id: 'credentials',
					children: [ 'password', 'confirmPassword' ],
				},
			],
		} ),
		[]
	);

	return (
		<Stack direction="row" align="start" gap="3xl">
			<CredentialsForm
				form={ staleForm }
				description="Separate top-level fields. Edit the 'password' after both match — the confirmation stays “valid” (stale). Edit 'confirm password' after both match — the confirmation re-validates immediately."
			/>
			<CredentialsForm
				form={ freshForm }
				description="Same fields grouped under one combined field. Edit the 'password' or the 'confirm password' — the confirmation re-validates immediately."
			/>
		</Stack>
	);
};

export default CrossFieldValidationComponent;

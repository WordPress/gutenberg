/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Internal dependencies
 */
import { DefaultConnectorSettings } from '../connector-item';
import type { ConnectorField } from '../types';

function baseField(
	overrides: Partial< ConnectorField > = {}
): ConnectorField {
	return {
		name: 'base_url',
		type: 'string',
		control: 'url',
		label: 'Server URL',
		description: '',
		placeholder: '',
		settingName: 'connectors_ai_openai_base_url',
		value: '',
		default: '',
		source: 'default',
		sensitive: false,
		readOnly: false,
		isStored: false,
		choices: null,
		credentialsUrl: null,
		...overrides,
	};
}

describe( 'DefaultConnectorSettings — legacy single-API-key form', () => {
	it( 'renders the API Key input when no configSchema is passed', () => {
		render( <DefaultConnectorSettings /> );

		expect(
			screen.getByRole( 'textbox', { name: /api key/i } )
		).toBeInTheDocument();
	} );

	it( 'calls onSave with the typed key', async () => {
		const onSave = jest.fn();
		const user = userEvent.setup();

		render( <DefaultConnectorSettings onSave={ onSave } /> );

		await user.type(
			screen.getByRole( 'textbox', { name: /api key/i } ),
			'sk-test-key'
		);
		await user.click( screen.getByRole( 'button', { name: /save/i } ) );

		expect( onSave ).toHaveBeenCalledWith( 'sk-test-key' );
	} );
} );

describe( 'DefaultConnectorSettings — schema-driven form', () => {
	it( 'renders a typed URL input for a url field', () => {
		render(
			<DefaultConnectorSettings
				configSchema={ [
					baseField( {
						label: 'Server URL',
						placeholder: 'https://example/v1',
					} ),
				] }
			/>
		);

		expect(
			screen.getByRole( 'textbox', { name: /server url/i } )
		).toHaveAttribute( 'placeholder', 'https://example/v1' );
	} );

	it( 'renders a password input for a password field', () => {
		render(
			<DefaultConnectorSettings
				configSchema={ [
					baseField( {
						name: 'api_key',
						control: 'password',
						label: 'API Key',
						sensitive: true,
					} ),
				] }
			/>
		);

		// Password inputs do not surface a textbox role — query by label instead.
		const field = screen.getByLabelText( /api key/i );
		expect( field ).toHaveAttribute( 'type', 'password' );
	} );

	it( 'renders a select with the provided choices', () => {
		render(
			<DefaultConnectorSettings
				configSchema={ [
					baseField( {
						name: 'preferred_model',
						control: 'select',
						label: 'Preferred model',
						choices: { 'gpt-4': 'GPT-4', 'gpt-5': 'GPT-5' },
					} ),
				] }
			/>
		);

		expect(
			screen.getByRole( 'combobox', { name: /preferred model/i } )
		).toBeInTheDocument();

		const options = screen
			.getAllByRole( 'option' )
			.map( ( o ) => o.textContent );

		expect( options ).toEqual( [ 'GPT-4', 'GPT-5' ] );
	} );

	it( 'renders a checkbox for a boolean field', () => {
		render(
			<DefaultConnectorSettings
				configSchema={ [
					baseField( {
						name: 'stream_by_default',
						type: 'boolean',
						control: 'checkbox',
						label: 'Stream responses by default',
					} ),
				] }
			/>
		);

		expect(
			screen.getByRole( 'checkbox', {
				name: /stream responses by default/i,
			} )
		).toBeInTheDocument();
	} );

	it( 'disables and hides Save for a read-only field (env / constant source)', () => {
		render(
			<DefaultConnectorSettings
				configSchema={ [
					baseField( {
						readOnly: true,
						source: 'env',
						value: 'https://from-env/v1',
					} ),
				] }
			/>
		);

		const input = screen.getByRole( 'textbox', { name: /server url/i } );
		expect( input ).toBeDisabled();
		expect(
			screen.queryByRole( 'button', { name: /^save$/i } )
		).not.toBeInTheDocument();
	} );

	it( 'shows the env-var help message for env-sourced fields', () => {
		render(
			<DefaultConnectorSettings
				configSchema={ [
					baseField( { source: 'env', readOnly: true } ),
				] }
			/>
		);

		expect(
			screen.getByText( /configured using an environment variable/i )
		).toBeInTheDocument();
	} );

	it( 'calls onSaveFields with the changed fields when the user saves', async () => {
		const onSaveFields = jest.fn().mockResolvedValue( undefined );
		const user = userEvent.setup();

		render(
			<DefaultConnectorSettings
				configSchema={ [ baseField() ] }
				onSaveFields={ onSaveFields }
			/>
		);

		const input = screen.getByRole( 'textbox', { name: /server url/i } );
		await user.type( input, 'https://typed/v1' );
		await user.click( screen.getByRole( 'button', { name: /^save$/i } ) );

		expect( onSaveFields ).toHaveBeenCalledWith( {
			base_url: 'https://typed/v1',
		} );
	} );

	it( 'renders a single Save button for a multi-field connector', () => {
		render(
			<DefaultConnectorSettings
				configSchema={ [
					baseField( { name: 'base_url', label: 'Server URL' } ),
					baseField( {
						name: 'default_model',
						control: 'text',
						label: 'Default model',
						settingName: 'connectors_ai_openai_default_model',
					} ),
				] }
			/>
		);

		expect(
			screen.getAllByRole( 'button', { name: /^save$/i } )
		).toHaveLength( 1 );
	} );

	it( 'only sends changed fields and re-disables Save after a successful save', async () => {
		const onSaveFields = jest.fn().mockResolvedValue( undefined );
		const user = userEvent.setup();

		render(
			<DefaultConnectorSettings
				configSchema={ [
					baseField( { name: 'base_url', label: 'Server URL' } ),
					baseField( {
						name: 'default_model',
						control: 'text',
						label: 'Default model',
						settingName: 'connectors_ai_openai_default_model',
					} ),
				] }
				onSaveFields={ onSaveFields }
			/>
		);

		// Edit only one of the two fields.
		await user.type(
			screen.getByRole( 'textbox', { name: /server url/i } ),
			'https://typed/v1'
		);

		const save = screen.getByRole( 'button', { name: /^save$/i } );
		expect( save ).not.toHaveAttribute( 'aria-disabled', 'true' );

		await user.click( save );

		// Only the edited field is sent.
		expect( onSaveFields ).toHaveBeenCalledWith( {
			base_url: 'https://typed/v1',
		} );

		// After a successful save the baseline updates, so Save re-disables.
		expect( save ).toHaveAttribute( 'aria-disabled', 'true' );
	} );

	it( 'disables Save until a field is dirty', () => {
		render(
			<DefaultConnectorSettings
				configSchema={ [ baseField( { value: 'https://saved/v1' } ) ] }
			/>
		);

		// The Save button uses `accessibleWhenDisabled`, so it stays focusable
		// and signals its disabled state via `aria-disabled` rather than the
		// native `disabled` attribute.
		expect(
			screen.getByRole( 'button', { name: /^save$/i } )
		).toHaveAttribute( 'aria-disabled', 'true' );
	} );

	it( 'renders nothing for the `custom` field type (slot-fill placeholder)', () => {
		render(
			<DefaultConnectorSettings
				configSchema={ [
					baseField( { name: 'advanced', control: 'custom' } ),
				] }
			/>
		);

		// `custom` fields are intentionally un-rendered by the default component —
		// plugins are expected to supply their own React via a slot-fill.
		expect( screen.queryByRole( 'textbox' ) ).not.toBeInTheDocument();
		expect( screen.queryByRole( 'button' ) ).not.toBeInTheDocument();
	} );

	it( 'renders all fields when multiple are declared', () => {
		render(
			<DefaultConnectorSettings
				configSchema={ [
					baseField( { name: 'base_url', label: 'Server URL' } ),
					baseField( {
						name: 'organisation_id',
						control: 'text',
						label: 'Organisation ID',
						settingName: 'connectors_ai_openai_organisation_id',
					} ),
				] }
			/>
		);

		expect(
			screen.getByRole( 'textbox', { name: /server url/i } )
		).toBeInTheDocument();
		expect(
			screen.getByRole( 'textbox', { name: /organisation id/i } )
		).toBeInTheDocument();
	} );
} );

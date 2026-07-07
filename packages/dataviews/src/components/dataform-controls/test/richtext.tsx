/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// The rich-text assembly (`./control`) wires `@wordpress/rich-text`'s
// useRichText hook (format types, event listeners, etc.) into the
// presentational `RichTextControl` shell from `@wordpress/components`, which is
// integration-heavy. Mock the assembly entirely so this file can verify the
// dataform control's prop wiring in isolation without standing up the real
// editing pipeline.
jest.mock( '../richtext/control', () => ( {
	__esModule: true,
	default( props: any ) {
		const handleChange = ( event: any ) =>
			props.onChange( event.target.value );

		return (
			<textarea
				aria-label={ props.label }
				data-test-id={ props.id }
				data-client-id={ props.clientId ?? '' }
				data-placeholder={ props.placeholder ?? '' }
				data-hide-label={ String( !! props.hideLabelFromVision ) }
				data-disable-formats={ String( !! props.disableFormats ) }
				data-disable-line-breaks={ String(
					!! props.disableLineBreaks
				) }
				data-without-interactive-formatting={ String(
					!! props.withoutInteractiveFormatting
				) }
				data-preserve-white-space={ String(
					!! props.preserveWhiteSpace
				) }
				data-allowed-formats={ JSON.stringify(
					props.allowedFormats ?? null
				) }
				data-raw-value={ JSON.stringify( props.value ) }
				data-help={ props.help ?? '' }
				data-required={ String( !! props.required ) }
				data-mark-when-optional={ String( !! props.markWhenOptional ) }
				data-custom-validity={ JSON.stringify(
					props.customValidity ?? null
				) }
				disabled={ !! props.disabled }
				value={ props.value ?? '' }
				onChange={ handleChange }
			/>
		);
	},
} ) );

/**
 * Internal dependencies
 */
import RichText from '../richtext';

type TestItem = { content: string };

function buildField( overrides: Record< string, any > = {} ) {
	return {
		id: 'content',
		label: 'Content',
		getValue: ( { item }: { item: TestItem } ) => item.content,
		setValue: ( { item, value }: { item: TestItem; value: string } ) => ( {
			...item,
			content: value,
		} ),
		// DataForm always hands controls a normalized field, which includes
		// `isDisabled` and `isValid`.
		isDisabled: () => false,
		isValid: {},
		...overrides,
	};
}

describe( 'dataform-controls/richtext', () => {
	it( 'forwards the field label and value to the control', () => {
		render(
			<RichText< TestItem >
				data={ { content: 'Hello world' } }
				field={ buildField() as any }
				onChange={ jest.fn() }
				hideLabelFromVision={ false }
				config={ {} }
			/>
		);

		const control = screen.getByLabelText(
			'Content'
		) as HTMLTextAreaElement;
		expect( control ).toBeInTheDocument();
		expect( control.value ).toBe( 'Hello world' );
		expect( control.dataset.testId ).toBe( 'content' );
	} );

	it( 'invokes onChange with the result of field.setValue when the value changes', async () => {
		const user = userEvent.setup();
		const onChange = jest.fn();
		render(
			<RichText< TestItem >
				data={ { content: '' } }
				field={ buildField() as any }
				onChange={ onChange }
				hideLabelFromVision={ false }
				config={ {} }
			/>
		);

		const control = screen.getByLabelText( 'Content' );
		await user.type( control, 'A' );

		expect( onChange ).toHaveBeenCalledTimes( 1 );
		expect( onChange ).toHaveBeenLastCalledWith( { content: 'A' } );
	} );

	it( 'normalizes a null field value to an empty string and still sets string values', async () => {
		const user = userEvent.setup();
		const onChange = jest.fn();
		render(
			<RichText< { content: string | null } >
				data={ { content: null } }
				field={ buildField() as any }
				onChange={ onChange }
				hideLabelFromVision={ false }
				config={ {} }
			/>
		);

		const control = screen.getByLabelText( 'Content' );
		/*
		 * `useRichText` behaves differently for `null` than for `undefined`
		 * (with `null` it can report changes as `RichTextData` instead of an
		 * HTML string), so the control must receive a string, never `null`.
		 */
		expect( control.dataset.rawValue ).toBe( JSON.stringify( '' ) );

		await user.type( control, 'A' );
		expect( onChange ).toHaveBeenLastCalledWith( { content: 'A' } );
	} );

	it( 'reads the placeholder from the field', () => {
		render(
			<RichText< TestItem >
				data={ { content: '' } }
				field={ buildField( { placeholder: 'No title' } ) as any }
				onChange={ jest.fn() }
				hideLabelFromVision={ false }
				config={ {} }
			/>
		);

		const control = screen.getByLabelText( 'Content' );
		expect( control.dataset.placeholder ).toBe( 'No title' );
	} );

	it( 'passes the optional config to the underlying control', () => {
		render(
			<RichText< TestItem >
				data={ { content: '' } }
				field={ buildField() as any }
				onChange={ jest.fn() }
				hideLabelFromVision
				config={ {
					clientId: 'abc-123',
					allowedFormats: [ 'core/bold' ],
					disableFormats: true,
					withoutInteractiveFormatting: true,
					preserveWhiteSpace: true,
					disableLineBreaks: true,
				} }
			/>
		);

		const control = screen.getByLabelText( 'Content' );
		expect( control.dataset.clientId ).toBe( 'abc-123' );
		expect( control.dataset.hideLabel ).toBe( 'true' );
		expect( control.dataset.disableFormats ).toBe( 'true' );
		expect( control.dataset.disableLineBreaks ).toBe( 'true' );
		expect( control.dataset.withoutInteractiveFormatting ).toBe( 'true' );
		expect( control.dataset.preserveWhiteSpace ).toBe( 'true' );
		expect( control.dataset.allowedFormats ).toBe(
			JSON.stringify( [ 'core/bold' ] )
		);
	} );

	it( 'derives the disabled state from field.isDisabled', () => {
		render(
			<RichText< TestItem >
				data={ { content: '' } }
				field={ buildField( { isDisabled: () => true } ) as any }
				onChange={ jest.fn() }
				hideLabelFromVision={ false }
				config={ {} }
			/>
		);

		expect( screen.getByLabelText( 'Content' ) ).toBeDisabled();
	} );

	it( 'forwards required, optional marking, help, and validity like the sibling text controls', () => {
		render(
			<RichText< TestItem >
				data={ { content: '' } }
				field={
					buildField( {
						description: 'Add a summary',
						isValid: { required: {} },
					} ) as any
				}
				onChange={ jest.fn() }
				hideLabelFromVision={ false }
				markWhenOptional
				config={ {} }
				validity={ {
					required: { type: 'invalid', message: 'Required field' },
				} }
			/>
		);

		const control = screen.getByLabelText( 'Content' );
		expect( control ).toHaveAttribute( 'data-required', 'true' );
		expect( control.dataset.markWhenOptional ).toBe( 'true' );
		expect( control.dataset.help ).toBe( 'Add a summary' );
		expect( control.dataset.customValidity ).toBe(
			JSON.stringify( { type: 'invalid', message: 'Required field' } )
		);
	} );

	it( 'tolerates a missing config object', () => {
		render(
			<RichText< TestItem >
				data={ { content: 'x' } }
				field={ buildField() as any }
				onChange={ jest.fn() }
				hideLabelFromVision={ false }
				config={ undefined }
			/>
		);

		const control = screen.getByLabelText( 'Content' );
		expect( control.dataset.clientId ).toBe( '' );
		expect( control.dataset.placeholder ).toBe( '' );
		expect( control.dataset.allowedFormats ).toBe( 'null' );
	} );
} );

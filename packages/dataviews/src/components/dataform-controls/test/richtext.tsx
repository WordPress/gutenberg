/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// The `RichTextControl` component depends on `@wordpress/rich-text`'s
// useRichText hook (format types, event listeners, etc.) which is
// integration-heavy. Mock the rich-text-control module entirely so this file
// can verify the control's prop wiring in isolation without standing up the
// real editing pipeline.
jest.mock( '@wordpress/rich-text-control', () => ( {
	RichTextControl( props: any ) {
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

	it( 'tolerates a missing config object', () => {
		render(
			<RichText< TestItem >
				data={ { content: 'x' } }
				field={ buildField() as any }
				onChange={ jest.fn() }
				hideLabelFromVision={ false }
				// @ts-expect-error - exercising the runtime guard for an absent config.
				config={ undefined }
			/>
		);

		const control = screen.getByLabelText( 'Content' );
		expect( control.dataset.clientId ).toBe( '' );
		expect( control.dataset.placeholder ).toBe( '' );
		expect( control.dataset.allowedFormats ).toBe( 'null' );
	} );
} );

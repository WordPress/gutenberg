/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import BindingsIndicatorHeader, {
	getFieldsWithBindingsIndicators,
} from '../bindings-indicator';

function getIndicator( container ) {
	// The indicator is a purely visual (aria-hidden) element, keyed off its
	// class for styling, so Testing Library's semantic queries can't reach it.
	return container.querySelector(
		'.block-editor-block-fields__bindings-indicator'
	);
}

describe( 'BindingsIndicatorHeader', () => {
	it( 'renders the field label', () => {
		render( <BindingsIndicatorHeader label="Content" isBound={ false } /> );

		expect( screen.getByText( 'Content' ) ).toBeInTheDocument();
	} );

	it( 'renders an unbound indicator without connection text', () => {
		const { container } = render(
			<BindingsIndicatorHeader label="Content" isBound={ false } />
		);

		const indicator = getIndicator( container );
		expect( indicator ).toBeVisible();
		expect( indicator ).not.toHaveClass( 'is-bound' );
		expect( screen.queryByText( /connected/i ) ).not.toBeInTheDocument();
	} );

	it( 'renders a bound indicator with the source name for screen readers', () => {
		const { container } = render(
			<BindingsIndicatorHeader
				label="Content"
				isBound
				sourceLabel="Post Meta"
			/>
		);

		expect( getIndicator( container ) ).toHaveClass( 'is-bound' );
		expect(
			screen.getByText( 'Connected to Post Meta' )
		).toBeInTheDocument();
	} );

	it( 'renders generic connection text when the source is unknown', () => {
		render( <BindingsIndicatorHeader label="Content" isBound /> );

		expect( screen.getByText( 'Connected' ) ).toBeInTheDocument();
	} );
} );

describe( 'getFieldsWithBindingsIndicators', () => {
	const fields = [
		{ id: 'content', label: 'Content', type: 'text' },
		{ id: 'level', label: 'Level', type: 'integer' },
	];

	it( 'adds a header to bindable fields only', () => {
		const result = getFieldsWithBindingsIndicators( fields, {
			bindableAttributes: [ 'content' ],
			bindings: undefined,
			sources: {},
		} );

		expect( result[ 0 ].header ).toBeDefined();
		expect( result[ 1 ].header ).toBeUndefined();
	} );

	it( 'marks fields with a binding as bound, using the source label', () => {
		const result = getFieldsWithBindingsIndicators( fields, {
			bindableAttributes: [ 'content' ],
			bindings: {
				content: { source: 'core/post-meta', args: { key: 'foo' } },
			},
			sources: { 'core/post-meta': { label: 'Post Meta' } },
		} );

		render( result[ 0 ].header );

		expect( screen.getByText( 'Content' ) ).toBeInTheDocument();
		expect(
			screen.getByText( 'Connected to Post Meta' )
		).toBeInTheDocument();
	} );

	it( 'renders an unbound indicator for bindable fields without a binding', () => {
		const result = getFieldsWithBindingsIndicators( fields, {
			bindableAttributes: [ 'content' ],
			bindings: undefined,
			sources: {},
		} );

		const { container } = render( result[ 0 ].header );

		const indicator = getIndicator( container );
		expect( indicator ).toBeVisible();
		expect( indicator ).not.toHaveClass( 'is-bound' );
	} );

	it( 'does not mutate the passed field definitions', () => {
		getFieldsWithBindingsIndicators( fields, {
			bindableAttributes: [ 'content' ],
			bindings: undefined,
			sources: {},
		} );

		expect( fields[ 0 ].header ).toBeUndefined();
	} );
} );

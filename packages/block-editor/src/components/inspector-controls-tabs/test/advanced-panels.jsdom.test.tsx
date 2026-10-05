import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SlotFillProvider } from '@wordpress/components';
import AdvancedControls from '../advanced-controls-panel';
import AdditionalStyles from '../additional-styles-panel';
import groups from '../../inspector-controls/groups';

// The `InspectorControls` fill component is bypassed in favour of the
// underlying group fills, so that the panels can be exercised without a
// selected block and its editing mode.
const AdvancedFill = groups.advanced.Fill;
const AdditionalStylesFill = groups[ 'additional-styles' ].Fill;

describe( 'AdvancedControls', () => {
	it( 'renders nothing when the advanced group has no fills', () => {
		render(
			<SlotFillProvider>
				<AdvancedControls initialOpen />
			</SlotFillProvider>
		);

		expect(
			screen.queryByRole( 'button', { name: 'Advanced' } )
		).not.toBeInTheDocument();
	} );

	it( 'renders the advanced group fills', () => {
		render(
			<SlotFillProvider>
				<AdvancedFill>
					<span>HTML anchor</span>
				</AdvancedFill>
				<AdvancedControls initialOpen />
			</SlotFillProvider>
		);

		expect(
			screen.getByRole( 'button', { name: 'Advanced' } )
		).toBeVisible();
		expect( screen.getByText( 'HTML anchor' ) ).toBeVisible();
	} );

	it( 'renders nothing when only the additional-styles group has fills', () => {
		render(
			<SlotFillProvider>
				<AdditionalStylesFill>
					<span>Additional CSS</span>
				</AdditionalStylesFill>
				<AdvancedControls initialOpen />
			</SlotFillProvider>
		);

		expect(
			screen.queryByRole( 'button', { name: 'Advanced' } )
		).not.toBeInTheDocument();
	} );
} );

describe( 'AdditionalStyles', () => {
	it( 'renders nothing when the additional-styles group has no fills', () => {
		render(
			<SlotFillProvider>
				<AdditionalStyles />
			</SlotFillProvider>
		);

		expect(
			screen.queryByRole( 'heading', { name: 'Additional styles' } )
		).not.toBeInTheDocument();
	} );

	it( 'renders the additional-styles group fills', () => {
		render(
			<SlotFillProvider>
				<AdditionalStylesFill>
					<span>Additional CSS</span>
				</AdditionalStylesFill>
				<AdditionalStyles />
			</SlotFillProvider>
		);

		expect(
			screen.getByRole( 'heading', { name: 'Additional styles' } )
		).toBeVisible();
		expect( screen.getByText( 'Additional CSS' ) ).toBeVisible();
	} );
} );

describe( 'Advanced and Additional styles together', () => {
	it( 'renders as two separate panels', () => {
		render(
			<SlotFillProvider>
				<AdvancedFill>
					<span>HTML anchor</span>
				</AdvancedFill>
				<AdditionalStylesFill>
					<span>Additional CSS</span>
				</AdditionalStylesFill>
				<AdditionalStyles />
				<AdvancedControls initialOpen />
			</SlotFillProvider>
		);

		expect(
			screen.getByRole( 'heading', { name: 'Additional styles' } )
		).toBeVisible();
		expect(
			screen.getByRole( 'button', { name: 'Advanced' } )
		).toBeVisible();
		expect( screen.getByText( 'Additional CSS' ) ).toBeVisible();
		expect( screen.getByText( 'HTML anchor' ) ).toBeVisible();
	} );
} );

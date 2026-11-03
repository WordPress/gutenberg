import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Navigator } from '@wordpress/components';
import FontSize from '../font-size';
import { usePresets } from '../../presets/use-presets';

globalThis.wpVitest.mockMatchMedia();

vi.mock( '../../presets/use-presets', () => ( {
	usePresets: vi.fn(),
} ) );
vi.mock( '../../hooks', () => ( {
	useSetting: vi.fn( () => [ false ] ),
} ) );
vi.mock( '../font-size-preview', () => ( {
	default: () => null,
} ) );
vi.mock( '../../presets/preset-edit-header', () => ( {
	default: () => null,
} ) );
vi.mock( '../../size-control', async () => {
	const { createElement } = await import( 'react' );
	return {
		SizeControl: ( {
			label,
			value,
			onChange,
			disabled,
		}: {
			label?: string;
			value?: string;
			onChange: ( value: string ) => void;
			disabled?: boolean;
		} ) =>
			createElement( 'input', {
				'aria-label': label,
				value: value ?? '',
				disabled,
				onChange: ( event: { target: { value: string } } ) =>
					onChange( event.target.value ),
			} ),
	};
} );

const preset = {
	name: 'Medium',
	slug: 'medium',
	size: '1rem',
	fluid: { min: '1rem', max: '1.125rem' },
};

function renderFontSize() {
	return render(
		<Navigator initialPath="/typography/font-sizes/theme/medium">
			<Navigator.Screen path="/typography/font-sizes/:origin/:slug">
				<FontSize />
			</Navigator.Screen>
		</Navigator>
	);
}

describe( 'FontSize custom fluid values', () => {
	let setPresets: ReturnType< typeof vi.fn >;

	beforeEach( () => {
		setPresets = vi.fn();
		vi.mocked( usePresets ).mockReturnValue( {
			presets: [ preset ],
			setPresets,
		} as never );
	} );

	it( 'writes the new maximum to both fluid.max and size in one update', () => {
		renderFontSize();

		fireEvent.change( screen.getByLabelText( 'Maximum' ), {
			target: { value: '1.5rem' },
		} );

		expect( setPresets ).toHaveBeenCalledTimes( 1 );
		expect( setPresets ).toHaveBeenCalledWith( [
			{
				...preset,
				size: '1.5rem',
				fluid: { min: '1rem', max: '1.5rem' },
			},
		] );
	} );

	it( 'leaves size untouched when the minimum changes', () => {
		renderFontSize();

		fireEvent.change( screen.getByLabelText( 'Minimum' ), {
			target: { value: '0.9rem' },
		} );

		expect( setPresets ).toHaveBeenCalledWith( [
			{
				...preset,
				size: '1rem',
				fluid: { min: '0.9rem', max: '1.125rem' },
			},
		] );
	} );

	it( 'leaves size untouched when the maximum is cleared', () => {
		renderFontSize();

		fireEvent.change( screen.getByLabelText( 'Maximum' ), {
			target: { value: '' },
		} );

		expect( setPresets ).toHaveBeenCalledWith( [
			{
				...preset,
				size: '1rem',
				fluid: { min: '1rem', max: '' },
			},
		] );
	} );
} );

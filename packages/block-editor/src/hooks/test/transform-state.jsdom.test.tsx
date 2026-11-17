import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TransformPanel from '../../components/global-styles/transform-panel';
import { getStateInheritedValue } from '../transform';

globalThis.wpVitest.mockMatchMedia();

describe( 'Transform panel in a block style state', () => {
	it( 'saves the block Y offset when only X is set on mobile', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		render(
			<TransformPanel
				value={ undefined }
				inheritedValue={ getStateInheritedValue(
					undefined,
					{ transform: { translate: { x: '10px', y: '20px' } } },
					{ viewport: '@mobile', pseudo: 'default' }
				) }
				settings={ { transform: { translate: true } } }
				onChange={ onChange }
			/>
		);

		const xOffset = screen.getByRole( 'spinbutton', { name: 'X offset' } );
		expect( xOffset ).toHaveValue( 10 );
		await user.clear( xOffset );
		await user.type( xOffset, '30' );

		expect( onChange ).toHaveBeenLastCalledWith( {
			transform: { translate: { x: '30px', y: '20px' } },
		} );
	} );
} );

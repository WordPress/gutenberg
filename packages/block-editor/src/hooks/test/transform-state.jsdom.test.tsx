import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TransformPanel from '../../components/global-styles/transform-panel';
import { getStateInheritedValue } from '../transform';

globalThis.wpVitest.mockMatchMedia();

describe( 'Transform panel in a block style state', () => {
	it( 'saves only X on mobile and shows the block offset as placeholders', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		render(
			<TransformPanel
				value={ undefined }
				inheritedValue={ getStateInheritedValue(
					undefined,
					{ transform: { translate: { x: '66px', y: '35px' } } },
					{ viewport: '@mobile', pseudo: 'default' }
				) }
				settings={ { transform: { translate: true } } }
				onChange={ onChange }
			/>
		);

		const xOffset = screen.getByRole( 'spinbutton', { name: 'X offset' } );
		expect( xOffset ).toHaveAttribute( 'placeholder', '66' );
		expect(
			screen.getByRole( 'spinbutton', { name: 'Y offset' } )
		).toHaveAttribute( 'placeholder', '35' );
		await user.type( xOffset, '21' );

		expect( onChange ).toHaveBeenLastCalledWith( {
			transform: { translate: { x: '21px' } },
		} );
	} );
} );

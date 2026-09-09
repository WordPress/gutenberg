import { expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render, screen } from '@testing-library/react';
import { LinkButton } from '../index';

it( 'shows the Link focus ring when focused', async () => {
	/* eslint-disable @wordpress/no-setting-ds-tokens -- This fixture supplies the focus tokens consumed by Link. */
	render(
		<LinkButton
			href="/example"
			style={
				{
					'--wpds-border-width-focus': '2px',
					'--wpds-color-stroke-focus': 'rgb(0, 0, 0)',
				} as React.CSSProperties
			}
		>
			Go to example
		</LinkButton>
	);
	/* eslint-enable @wordpress/no-setting-ds-tokens */

	await userEvent.tab();

	const link = screen.getByRole( 'link', { name: 'Go to example' } );
	expect( link ).toHaveFocus();
	const styles = getComputedStyle( link );
	expect( styles.outlineStyle ).toBe( 'solid' );
	expect( styles.outlineWidth ).toBe( '2px' );
} );

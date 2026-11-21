import { expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { wordpress } from '@wordpress/icons';
import '@wordpress/theme/design-tokens.css';
import { Button } from '../index';

it( 'keeps the icon at full size when the button is narrower than its content', async () => {
	const view = await render(
		<div style={ { width: 90 } }>
			<Button>
				<Button.Icon icon={ wordpress } />
				Copy to clipboard
			</Button>
		</div>
	);

	const icon = view.container.querySelector( 'svg' )!;
	expect( icon.getBoundingClientRect().width ).toBe( 24 );
} );

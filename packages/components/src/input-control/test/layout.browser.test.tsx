import { expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import '@wordpress/theme/design-tokens.css';
import InputControl from '..';

it.each( [ 'inherit', 'INHERIT', ' inherit ' ] )(
	'preserves inherited input width for %j',
	async ( width ) => {
		await render(
			<InputControl
				label="Input"
				__unstableInputWidth={ width }
				style={ { width: 240, alignItems: 'flex-start' } }
			/>
		);
		const container = document.querySelector(
			'.components-input-control__container'
		)!;
		expect( getComputedStyle( container ).width ).toBe( '240px' );
	}
);

it.each( [ 'inherit', 'INHERIT', ' inherit ' ] )(
	'preserves the edge flex fallback for %j',
	async ( width ) => {
		await render(
			<InputControl
				label="Input"
				labelPosition="edge"
				__unstableInputWidth={ width }
			/>
		);
		const container = document.querySelector(
			'.components-input-control__container'
		)!;
		expect( getComputedStyle( container ).flex ).toBe( '1 1 0%' );
	}
);

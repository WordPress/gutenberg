import { expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { screen } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import '@wordpress/theme/design-tokens.css';
import Modal from '../';
import '../style.scss';

it.each( [ false, true ] )(
	'keeps the scroll-area focus outline aligned with the frame corners (hidden header: %s)',
	async ( hideHeader ) => {
		const user = userEvent.setup();
		await render(
			<Modal
				title="Scrollable dialog"
				__experimentalHideHeader={ hideHeader }
				style={ { borderRadius: 24 } }
				onRequestClose={ () => {} }
			>
				<button>Content action</button>
				<div style={ { height: 2000 } }>Long content</div>
			</Modal>
		);

		const content = await screen.findByRole( 'document', {
			name: 'Scrollable section',
		} );
		await user.tab();
		await expect.element( content ).toHaveFocus();

		const frameStyle = getComputedStyle( screen.getByRole( 'dialog' ) );
		const contentStyle = getComputedStyle( content );
		expect( contentStyle.outlineStyle ).toBe( 'solid' );
		expect( contentStyle.borderBottomLeftRadius ).toBe(
			frameStyle.borderBottomLeftRadius
		);
		expect( contentStyle.borderBottomRightRadius ).toBe(
			frameStyle.borderBottomRightRadius
		);
		expect( contentStyle.borderTopLeftRadius ).toBe(
			hideHeader ? frameStyle.borderTopLeftRadius : '0px'
		);
		expect( contentStyle.borderTopRightRadius ).toBe(
			hideHeader ? frameStyle.borderTopRightRadius : '0px'
		);
	}
);

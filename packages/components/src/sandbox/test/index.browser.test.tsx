import { expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { screen, waitFor } from '@testing-library/react';
import SandBox from '..';

it( 'restores current content and metadata when a same-origin iframe moves', async () => {
	const props = {
		allowSameOrigin: true,
		title: 'Original title',
		styles: [ 'body{color:red}' ],
	};
	const view = await render(
		<SandBox { ...props } html="<p>Original content</p>" />
	);
	const iframe = screen.getByTitle< HTMLIFrameElement >( 'Original title' );
	await waitFor( () =>
		expect( iframe.contentDocument?.body.textContent ).toContain(
			'Original content'
		)
	);
	await view.rerender(
		<SandBox { ...props } html="<p>Current content</p>" />
	);
	await waitFor( () =>
		expect( iframe.contentDocument?.body.textContent ).toContain(
			'Current content'
		)
	);
	await view.rerender(
		<SandBox
			allowSameOrigin
			title="Current title"
			html="<p>Current content</p>"
			styles={ [ 'body{color:blue}' ] }
		/>
	);
	expect( iframe.contentDocument?.title ).toBe( 'Original title' );
	const parent = view.container;
	const target = document.createElement( 'div' );
	document.body.append( target );
	try {
		const loaded = new Promise( ( resolve ) =>
			iframe.addEventListener( 'load', resolve, { once: true } )
		);
		target.append( iframe );
		await loaded;
		await waitFor( () =>
			expect( iframe.contentDocument?.body.textContent ).toContain(
				'Current content'
			)
		);
		expect( iframe.contentDocument?.title ).toBe( 'Current title' );
		expect( iframe.contentDocument?.head.textContent ).toContain(
			'body{color:blue}'
		);
	} finally {
		parent.append( iframe );
		target.remove();
	}
} );

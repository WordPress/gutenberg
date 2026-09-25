import { expect, it, vi } from 'vitest';
import { playwright } from '@vitest/browser-playwright';
import { createPlaywrightProvider } from '../../config/playwright-provider.mjs';

vi.mock( '@vitest/browser-playwright', () => ( {
	playwright: vi.fn(),
} ) );

it( 'selects the live tester iframe when the cached frame belongs to the previous file', async () => {
	const previousFrame = { url: 'previous-test' };
	const currentFrame = { url: 'current-test' };
	const handle = {
		contentFrame: vi.fn().mockResolvedValue( currentFrame ),
		dispose: vi.fn().mockResolvedValue( undefined ),
	};
	const locator = { elementHandle: vi.fn().mockResolvedValue( handle ) };
	const context = {
		page: { locator: vi.fn().mockReturnValue( locator ) },
		frame: vi.fn().mockResolvedValue( previousFrame ),
		iframe: {},
	};
	const getCommandsContext = vi.fn().mockReturnValue( context );
	const instance = { getCommandsContext };
	const provider = {
		name: 'playwright',
		prewarm: vi.fn(),
		providerFactory: vi.fn().mockReturnValue( instance ),
	};
	playwright.mockReturnValue( provider );

	const configured = createPlaywrightProvider();
	const project = {};
	const commands = configured
		.providerFactory( project )
		.getCommandsContext( 'session' );

	expect( await commands.frame() ).toBe( currentFrame );
	expect( context.frame ).not.toHaveBeenCalled();
	expect( context.page.locator ).toHaveBeenCalledExactlyOnceWith(
		'iframe[data-vitest="true"]'
	);
	expect( handle.dispose ).toHaveBeenCalledExactlyOnceWith();
	expect( commands.iframe ).toBe( context.iframe );
	expect( configured.prewarm ).toBe( provider.prewarm );
	expect( provider.providerFactory ).toHaveBeenCalledExactlyOnceWith(
		project
	);
	expect( getCommandsContext ).toHaveBeenCalledExactlyOnceWith( 'session' );
} );

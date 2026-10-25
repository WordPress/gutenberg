import { playwright } from '@vitest/browser-playwright';

export function createPlaywrightProvider() {
	const provider = playwright();
	return {
		...provider,
		providerFactory( project ) {
			const instance = provider.providerFactory( project );
			const getCommandsContext =
				instance.getCommandsContext.bind( instance );
			instance.getCommandsContext = ( sessionId ) => {
				const context = getCommandsContext( sessionId );
				return {
					...context,
					async frame() {
						// Vitest's name-based lookup can select the previous test's
						// frame before Playwright processes iframe replacement events.
						// Resolve the current iframe through the live DOM instead.
						const handle = await context.page
							.locator( 'iframe[data-vitest="true"]' )
							.elementHandle();
						try {
							return await handle.contentFrame();
						} finally {
							await handle.dispose();
						}
					},
				};
			};
			return instance;
		},
	};
}

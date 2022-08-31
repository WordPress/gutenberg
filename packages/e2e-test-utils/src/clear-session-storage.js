/**
 * Clears the session storage.
 */
export async function clearSessionStorage() {
	await page.evaluate( () => window.sessionStorage.clear() );
}

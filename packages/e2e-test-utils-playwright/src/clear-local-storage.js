/**
 * Clears the local storage.
 */
export async function clearLocalStorage() {
	await this.page.evaluate( () => window.localStorage.clear() );
}

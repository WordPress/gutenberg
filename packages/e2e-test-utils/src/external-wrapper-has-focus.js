export async function externalWrapperHasFocus( blockType ) {
	const activeElementDataType = await page.evaluate( () => document.activeElement.dataset.type );
	await expect( activeElementDataType ).toEqual( blockType );
}

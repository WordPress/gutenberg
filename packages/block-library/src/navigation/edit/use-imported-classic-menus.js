function useImportedClassicMenus() {
	if ( ! window.localStorage.getItem( 'classic_menus_imported' ) ) {
		window.localStorage.setItem(
			'classic_menus_imported',
			JSON.stringify( [ ...new Map() ] )
		);
	}
	const importedClassicMenus = new Map(
		JSON.parse( window.localStorage.getItem( 'classic_menus_imported' ) )
	);

	function setImportedClassicMenu( navMenuId, classicMenuId ) {
		importedClassicMenus.set( navMenuId, classicMenuId );
		window.localStorage.setItem(
			'classic_menus_imported',
			JSON.stringify( Array.from( importedClassicMenus.entries() ) )
		);
	}

	return { importedClassicMenus, setImportedClassicMenu };
}

export default useImportedClassicMenus;

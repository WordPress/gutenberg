let _isOfflineMode = false;

export async function toggleOfflineMode(isOffline) {
	_isOfflineMode = isOffline;
	page.setOfflineMode(isOffline);
}

export function isOfflineMode() {
	return _isOfflineMode;
}

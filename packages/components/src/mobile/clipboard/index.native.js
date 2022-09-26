const createClipboard = () => {
	let currentClipboard;

	const setClipboard = ( clipboard ) => {
		currentClipboard = clipboard;
	};

	const getClipboard = () => currentClipboard;

	return {
		setClipboard,
		getClipboard,
	};
};

const clipboard = createClipboard();

export const { setClipboard, getClipboard } = clipboard;

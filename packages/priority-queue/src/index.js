export const createQueue = () => {
	const waitingList = [];
	const elementsMap = new WeakMap();
	let isRunning = false;

	const runWaitingList = () => {
		if ( waitingList.length === 0 ) {
			isRunning = false;
			return;
		}
		const nextElement = waitingList.shift();
		elementsMap.get( nextElement )();
		elementsMap.delete( nextElement );
		window.requestAnimationFrame( runWaitingList );
	};

	const add = ( element, item ) => {
		if ( ! elementsMap.has( element ) ) {
			waitingList.push( element );
		}
		elementsMap.set( element, item );
		if ( ! isRunning ) {
			isRunning = true;
			window.requestAnimationFrame( runWaitingList );
		}
	};

	const flush = ( element ) => {
		if ( ! elementsMap.has( element ) ) {
			return false;
		}

		elementsMap.delete( element );
		const index = waitingList.indexOf( element );
		waitingList.splice( index, 1 );

		return true;
	};

	return {
		add,
		flush,
	};
};

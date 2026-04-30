import { useState, useEffect } from '@wordpress/element';
		const intervalId = setInterval( () => {
			const remaining = Math.ceil( ( retryAt - Date.now() ) / 1000 );
			setSecondsRemaining( Math.max( 0, remaining ) );
			if ( remaining <= 0 ) {
				clearInterval( intervalId );
		return () => clearInterval( intervalId );
		onManualRetry: () => setSecondsRemaining( 0 ),

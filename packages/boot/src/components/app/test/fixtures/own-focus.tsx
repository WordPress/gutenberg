import { Page } from '@wordpress/admin-ui';
import { useEffect, useRef } from '@wordpress/element';

// Moves focus to its own button when it mounts after focus was lost.
function Stage() {
	const ref = useRef< HTMLButtonElement >( null );

	useEffect( () => {
		const ownerDocument = ref.current?.ownerDocument;
		if ( ownerDocument?.activeElement === ownerDocument?.body ) {
			ref.current?.focus();
		}
	}, [] );

	return (
		<Page ariaLabel="Own focus">
			<button ref={ ref }>Own focus</button>
		</Page>
	);
}

export const stage = Stage;

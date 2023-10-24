/**
 * WordPress dependencies
 */
import { Suspense, lazy } from '@wordpress/element';

export default function lazyEdit( cb ) {
	// eslint-disable-next-line @wordpress/no-unused-vars-before-return
	const Load = lazy( cb );
	return function Edit( props ) {
		return (
			<Suspense fallback={ null }>
				<Load { ...props } />
			</Suspense>
		);
	};
}

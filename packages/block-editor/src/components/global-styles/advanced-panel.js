/**
 * WordPress dependencies
 */
import { Suspense, lazy } from '@wordpress/element';

/**
 * Internal dependencies
 */
const CSSEditor = lazy( () => import( './css-editor' ) );

export default function AdvancedPanel( {
	value,
	onChange,
	inheritedValue = value,
} ) {
	// Custom CSS
	const customCSS = inheritedValue?.css;

	return (
		<Suspense>
			<CSSEditor onChange={ onChange } value={ customCSS } />
		</Suspense>
	);
}

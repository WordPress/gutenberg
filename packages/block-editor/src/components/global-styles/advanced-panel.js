/**
 * Internal dependencies
 */
import CSSEditor from './css-editor';

export default function AdvancedPanel( {
	value,
	onChange,
	inheritedValue = value,
} ) {
	// Custom CSS
	const customCSS = inheritedValue?.css;

	return <CSSEditor onChange={ onChange } value={ customCSS } />;
}

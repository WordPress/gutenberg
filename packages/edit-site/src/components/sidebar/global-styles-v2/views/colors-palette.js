/**
 * Internal dependencies
 */
import { useGlobalStylesNavigationContext } from '../navigation/context';

export default function GlobalStylesViewColorsPalette() {
	const { setCurrentView } = useGlobalStylesNavigationContext();

	const navigateToColorsElement = () => setCurrentView( 'colors-element' );

	return (
		<>
			<h3>Colors Palette view</h3>
			<button onClick={ navigateToColorsElement }>
				&lt; Back to Colors Element view
			</button>
		</>
	);
}

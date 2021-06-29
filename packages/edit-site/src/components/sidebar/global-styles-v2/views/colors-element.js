/**
 * Internal dependencies
 */
import { useGlobalStylesNavigationContext } from '../navigation/context';

export default function GlobalStylesViewColorsElement() {
	const { setCurrentView } = useGlobalStylesNavigationContext();

	const navigateToColors = () => setCurrentView( 'colors' );
	const navigateToColorsPalette = () => setCurrentView( 'colors-palette' );

	return (
		<>
			<h3>Colors Element view</h3>
			<button onClick={ navigateToColors }>
				&lt; Back to Colors view
			</button>
			<button onClick={ navigateToColorsPalette }>
				Go to Colors Palette view &gt;
			</button>
		</>
	);
}

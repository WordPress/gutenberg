/**
 * Internal dependencies
 */
import { useGlobalStylesNavigationContext } from '../navigation/context';

export default function GlobalStylesViewColors() {
	const { setCurrentView } = useGlobalStylesNavigationContext();

	const navigateToColorsElement = () => setCurrentView( 'colors-element' );
	const navigateToRoot = () => setCurrentView( 'root' );

	return (
		<>
			<h3>Colors view</h3>
			<button onClick={ navigateToRoot }>&lt; Back to Root view</button>
			<button onClick={ navigateToColorsElement }>
				Go to Colors Element view &gt;
			</button>
		</>
	);
}

/**
 * Internal dependencies
 */
import { useGlobalStylesNavigationContext } from '../navigation/context';

export default function GlobalStylesViewRoot() {
	const { setCurrentView } = useGlobalStylesNavigationContext();

	const navigateToColors = () => setCurrentView( 'colors' );
	const navigateToTypography = () => setCurrentView( 'typography' );

	return (
		<>
			<h3>Root (main) view</h3>
			<button onClick={ navigateToColors }>Go to Colors view &gt;</button>
			<button onClick={ navigateToTypography }>
				Go to Typography view &gt;
			</button>
		</>
	);
}

/**
 * Internal dependencies
 */
import { useGlobalStylesNavigationContext } from '../navigation/context';

export default function GlobalStylesViewTypography() {
	const { setCurrentView } = useGlobalStylesNavigationContext();

	const navigateToTypographyElement = () =>
		setCurrentView( 'typography-element' );
	const navigateToRoot = () => setCurrentView( 'root' );

	return (
		<>
			<h3>Typography view</h3>
			<button onClick={ navigateToRoot }>&lt; Back to Root view</button>
			<button onClick={ navigateToTypographyElement }>
				Go to Typography Element view &gt;
			</button>
		</>
	);
}

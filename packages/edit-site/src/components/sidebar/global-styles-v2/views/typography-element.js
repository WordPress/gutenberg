/**
 * Internal dependencies
 */
import { useGlobalStylesNavigationContext } from '../navigation/context';

export default function GlobalStylesViewTypographyElement() {
	const { setCurrentView } = useGlobalStylesNavigationContext();

	const navigateToTypography = () => setCurrentView( 'typography' );

	return (
		<>
			<h3>Typography Element view</h3>
			<button onClick={ navigateToTypography }>
				&lt; Back to Typography view
			</button>
		</>
	);
}

/**
 * Internal dependencies
 */
import Button from '../../button';
import { NavigatorProvider, NavigatorScreen, useNavigator } from '../';

export default {
	title: 'Components (Experimental)/Navigator',
	component: NavigatorProvider,
};

function NavigatorButton( { path, isBack = false, ...props } ) {
	const navigator = useNavigator();
	return (
		<Button
			onClick={ () => navigator.push( path, { isBack } ) }
			{ ...props }
		/>
	);
}

const MyNavigation = () => (
	<NavigatorProvider initialPath="/">
		<NavigatorScreen path="/">
			<p>This is the home screen.</p>
			<NavigatorButton isPrimary path="/child">
				Navigate to child screen.
			</NavigatorButton>
		</NavigatorScreen>

		<NavigatorScreen path="/child">
			<p>This is the child screen.</p>
			<NavigatorButton isPrimary path="/" isBack>
				Go back
			</NavigatorButton>
		</NavigatorScreen>
	</NavigatorProvider>
);

export const _default = () => {
	return <MyNavigation />;
};

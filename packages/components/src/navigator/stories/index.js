/**
 * Internal dependencies
 */
import Button from '../../button';
import { CardBody, CardHeader } from '../../card';
import { Flyout } from '../../flyout';
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

			<Flyout
				trigger={ <Button>Click top open test dialog</Button> }
				placement="bottom-start"
			>
				<CardHeader>Go</CardHeader>
				<CardBody>Stuff</CardBody>
			</Flyout>
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

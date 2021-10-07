/**
 * Internal dependencies
 */
import Button from '../../button';
import { Card, CardBody, CardHeader } from '../../card';
import { HStack } from '../../h-stack';
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

const MyNavigation = () => {
	return (
		<NavigatorProvider initialPath="/">
			<NavigatorScreen path="/">
				<Card>
					<CardBody>
						<p>This is the home screen.</p>

						<HStack justify="flex-start" wrap>
							<NavigatorButton isPrimary path="/child">
								Navigate to child screen.
							</NavigatorButton>

							<NavigatorButton path="/overflow-child">
								Navigate to screen with horizontal overflow.
							</NavigatorButton>

							<Flyout
								trigger={ <Button>Open test dialog</Button> }
								placement="bottom-start"
							>
								<CardHeader>Go</CardHeader>
								<CardBody>Stuff</CardBody>
							</Flyout>
						</HStack>
					</CardBody>
				</Card>
			</NavigatorScreen>

			<NavigatorScreen path="/child">
				<Card>
					<CardBody>
						<p>This is the child screen.</p>
						<NavigatorButton isPrimary path="/" isBack>
							Go back
						</NavigatorButton>
					</CardBody>
				</Card>
			</NavigatorScreen>
			<NavigatorScreen path="/overflow-child">
				<Card>
					<CardBody>
						<NavigatorButton isPrimary path="/" isBack>
							Go back
						</NavigatorButton>
						<div
							style={ {
								display: 'inline-block',
								background: 'papayawhip',
							} }
						>
							<span
								style={ {
									color: 'palevioletred',
									whiteSpace: 'nowrap',
									fontSize: '42vw',
								} }
							>
								¯\_(ツ)_/¯
							</span>
						</div>
					</CardBody>
				</Card>
			</NavigatorScreen>
		</NavigatorProvider>
	);
};

export const _default = () => {
	return <MyNavigation />;
};

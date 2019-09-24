/**
 * External dependencies
 */
import React from 'react';
import { BrowserRouter as Router, Route, Redirect, Switch } from 'react-router-dom';
/**
 * Internal dependencies
 */
import HeaderNavigation from './components/header-navigation';
import Layout from './components/layout';

import HomePage from './pages/home';
import ComponentsPage from './pages/components';

function App() {
	return (
		<Router>
			<Switch>
				<Redirect exact from="/components" to="/components/animate/" />
				<>
					<HeaderNavigation />
					<Layout>
						<Layout.Main>
							<Route path="/" exact component={ HomePage } />
							<Route path="/components" component={ ComponentsPage } />
						</Layout.Main>
					</Layout>
				</>
			</Switch>
		</Router>
	);
}

export default App;

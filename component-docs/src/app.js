/**
 * External dependencies
 */
import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';

/**
 * Internal dependencies
 */
import Navigation from './components/navigation';
import Layout from './components/layout';
import Page from './components/page';

function App() {
	return (
		<Router>
			<div className="App">
				<Layout>
					<Layout.Sidebar>
						<Navigation />
					</Layout.Sidebar>
					<Layout.Main>
						<Layout.Content>
							<Page />
						</Layout.Content>
					</Layout.Main>
				</Layout>
			</div>
		</Router>
	);
}

export default App;

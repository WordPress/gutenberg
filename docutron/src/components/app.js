/**
 * External Dependencies
 */
import React from 'react';
import { BrowserRouter, Route } from 'react-router-dom';

/**
 * Internal Dependencies
 */
import { getStories } from '../config';
import Header from './header';
import Sidebar from './sidebar';
import Page from './page';

function App() {
	return (
		<BrowserRouter>
			<div className="single-handbook">
				<Header />
				<div id="page">
					<div id="main" className="site-main clear">
						<Sidebar />
						<div id="primary" className="content-area">
							{ getStories().map( ( story, index ) => (
								<Route key={ index } path={ story.path } exact render={
									() => <Page story={ story } />
								} />
							) ) }
						</div>
					</div>
				</div>
			</div>
		</BrowserRouter>
	);
}

export default App;

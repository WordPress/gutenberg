import React from 'react';
import { BrowserRouter, Route } from 'react-router-dom';

import { getStories } from 'glutenberg';
import Sidebar from './Sidebar';
import Page from './Page';

function App() {
	return (
		<BrowserRouter>
			<div className="single-handbook">
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

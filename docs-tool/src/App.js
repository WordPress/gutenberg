import React, { Component } from 'react';
import { BrowserRouter, Route } from 'react-router-dom';
import Prism from 'prismjs';

import { getStories } from 'glutenberg';
import Sidebar from './Sidebar';

const createPage = ( Comp ) => class extends Component {
	componentDidMount( prevProps ) {
		Prism.highlightAll();
	}

	render() {
		return <Comp />;
	}
}

const App = () => {
  return (
	  <BrowserRouter>
			<div className="single-handbook">
				<div id="page">
			    <div id="main" className="site-main clear">
						<Sidebar />
						<div id="primary" className="content-area">
							{ getStories().map( ( { path, Component: Comp }, index ) => (
								<Route key={ index } path={ path } component={ createPage( Comp ) } exact />
							) ) }
						</div>
			    </div>
				</div>
			</div>
	  </BrowserRouter>
  );
}

export default App;

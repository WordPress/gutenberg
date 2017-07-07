import React from 'react';
import { Link } from 'react-router-dom';

import { getStoriesTree } from 'glutenberg';

function MenuItem( { item } ) {
	return (
		<li>
			{ ! item.children.length && <Link to={ item.path }>{ item.title }</Link> }
			{ !! item.children.length && (
				<div className="expandable">
					<span className="dashicons dashicons-arrow-down-alt2"></span>
					<Link to={ item.path }>{ item.title }</Link>
				</div>
			) }
			{ !! item.children.length && (
				<ul>
					{ item.children.map( ( story, index) => (
						<MenuItem key={ index } item={ story } />
					) ) }
				</ul>
			) }
		</li>
	);
}

function Sidebar() {
	return (
		<div id="secondary" className="widget-area">
			<div className="secondary-content">
				<aside id="handbook_pages-3" className="widget widget_wporg_handbook_pages">
					<h2 className="widget-title">Documentation</h2>
					<div className="menu-table-of-contents-container">
						<ul>
							{ getStoriesTree().map( ( story, index ) => (
								<MenuItem key={ index } item={ story } />
							) ) }
						</ul>
					</div>
				</aside>
			</div>
		</div>
	);
}

export default Sidebar;

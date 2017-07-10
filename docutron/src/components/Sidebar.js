import React from 'react';
import { Link } from 'react-router-dom';

import { getStories, getChildren } from 'docutron';

function MenuItem( { item } ) {
	const children = getChildren( item.id );
	return (
		<li>
			{ ! children.length && <Link to={ item.path }>{ item.title }</Link> }
			{ !! children.length && (
				<div className="expandable">
					<Link to={ item.path }>{ item.title }</Link>
				</div>
			) }
			{ !! children.length && (
				<ul>
					{ children.map( ( story, index ) => (
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
				<aside id="handbook" className="widget widget_wporg_handbook_pages">
					<h2 className="widget-title">Chapters</h2>
					<div className="menu-table-of-contents-container">
						<ul>
							{ getStories()
								.filter( ( story ) => ! story.parent )
									.map( ( story, index ) => (
										<MenuItem key={ index } item={ story } />
									) )
							}
						</ul>
					</div>
				</aside>
			</div>
		</div>
	);
}

export default Sidebar;

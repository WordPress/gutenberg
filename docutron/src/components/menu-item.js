/**
 * External dependencies
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { find } from 'lodash';

/**
 * Internal dependencies
 */
import { getChildren } from '../config';

function MenuItem( { item, searchResults } ) {
	const children = getChildren( item.id );
	const isVisible = ! searchResults ||
		!! find( searchResults, ( story ) => {
			return story.id === item.id ||
				( story.parents && story.parents.indexOf( item.id ) !== -1 );
		} );

	if ( ! isVisible ) {
		return null;
	}

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
						<MenuItem key={ index } item={ story } searchResults={ searchResults } />
					) ) }
				</ul>
			) }
		</li>
	);
}

export default MenuItem;

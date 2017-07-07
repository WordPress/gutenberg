import React from 'react';
import ReactMarkdown from 'react-markdown';

const stories = [];

export function addStory( story ) {
	const { name, parents = [], markdown } = story;
	stories.push( {
		path: '/' + parents.concat( name ).join( '/' ),
		id: parents.concat( name ).join( '.' ),
		parent: parents.join( '.' ),
		Component: markdown ? () => <ReactMarkdown source={ markdown } /> : story.Component,
		...story,
	} );
}

export function getStories() {
	return stories;
}

export function getStoriesTree() {
	const buildTreeNode = ( story ) => {
		return  {
			...story,
			children: buildTreeChildren( story.id ),
		};
	}

	const buildTreeChildren = ( parentId = '' ) => {
		return stories
			.filter( ( story ) => story.parent === parentId )
			.map( buildTreeNode );
	};

	return buildTreeChildren();
}

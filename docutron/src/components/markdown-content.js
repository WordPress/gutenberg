/**
 * External dependencies
 */
import React from 'react';

/**
 * Internal dependencies
 */
import markdown from '../markdown';
import Tabs from './tabs';

function MarkdownContent( { content } ) {
	const blocks = markdown( content );

	return (
		<div>
			{ blocks.map( ( block, index ) => {
				if ( block.type === 'raw' ) {
					return <div key={ index } dangerouslySetInnerHTML={ { __html: block.content } } />;
				}
				if ( block.type === 'codetabs' ) {
					return <Tabs key={ index } tabs={ block.tabs } />;
				}

				return null;
			} ) }
		</div>
	);
}

export default MarkdownContent;

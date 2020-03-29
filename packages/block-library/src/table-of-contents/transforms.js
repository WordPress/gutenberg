/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';
import { renderToString } from '@wordpress/element';

/**
 * Internal dependencies
 */
import ListItem from './list-item';
import { linearToNestedHeadingList } from './utils';

const transforms = {
	to: [
		{
			type: 'block',
			blocks: [ 'core/list' ],
			transform: ( { headings } ) => {
				return createBlock( 'core/list', {
					values: renderToString(
						<ListItem noWrapList>
							{ linearToNestedHeadingList( headings ) }
						</ListItem>
					),
				} );
			},
		},
	],
};

export default transforms;

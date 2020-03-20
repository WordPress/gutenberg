/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';
import { renderToString } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { linearToNestedHeadingList } from './utils';
import ListItem from './ListItem';

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

/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';
import { renderToString } from '@wordpress/element';

/**
 * Internal dependencies
 */
import * as Utils from './utils';
import ListLevel from './ListLevel';

const transforms = {
	to: [
		{
			type: 'block',
			blocks: [ 'core/list' ],
			transform: ( { headings } ) => {
				return createBlock( 'core/list', {
					values: renderToString(
						<ListLevel noWrapList>
							{ Utils.linearToNestedHeadingList( headings ) }
						</ListLevel>
					),
				} );
			},
		},
	],
};

export default transforms;

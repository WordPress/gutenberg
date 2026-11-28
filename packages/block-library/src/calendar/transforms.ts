import { createBlock } from '@wordpress/blocks';
import type { BlockConfiguration } from '@wordpress/blocks';
import type { CalendarAttributes } from './types';

const transforms: BlockConfiguration< CalendarAttributes >[ 'transforms' ] = {
	from: [
		{
			type: 'block',
			blocks: [ 'core/archives' ],
			transform: () => createBlock( 'core/calendar' ),
		},
	],
	to: [
		{
			type: 'block',
			blocks: [ 'core/archives' ],
			transform: () => createBlock( 'core/archives' ),
		},
	],
};

export default transforms;

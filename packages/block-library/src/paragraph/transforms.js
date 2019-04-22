/**
 * WordPress dependencies
 */
import { getPhrasingContentSchema } from '@wordpress/blocks';

const transforms = {
	from: [
		{
			type: 'raw',
			// Paragraph is a fallback and should be matched last.
			priority: 20,
			selector: 'p',
			schema: {
				p: {
					children: getPhrasingContentSchema(),
				},
			},
		},
	],
};

export default transforms;

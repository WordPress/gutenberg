/**
 * External dependencies
 */
import React from 'react';

/**
 * Internal dependencies
 */
import { Spacer } from '../../spacer';
import { Tag } from '../index';
import { TAG_COLORS } from '../utils';

export default {
	component: Tag,
	title: 'Components (Experimental)/Tag',
};

export const _default = () => {
	const tags = Object.keys( TAG_COLORS );

	return (
		<>
			<Spacer>
				{ tags.map( ( tag ) => (
					<Tag color={ tag } key={ tag }>
						{ tag }
					</Tag>
				) ) }
			</Spacer>
			<Spacer>
				{ tags.map( ( tag ) => (
					<Tag color={ tag } key={ tag } removeButtonText="Remove">
						{ tag }
					</Tag>
				) ) }
			</Spacer>
		</>
	);
};

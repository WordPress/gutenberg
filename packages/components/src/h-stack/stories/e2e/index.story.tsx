/**
 * External dependencies
 */
import type { StoryFn, Meta } from '@storybook/react';

/**
 * Internal dependencies
 */
import { View } from '../../../view';
import { HStack } from '../..';

const meta: Meta< typeof HStack > = {
	component: HStack,
	title: 'Components (Experimental)/HStack',
};
export default meta;

const Template: StoryFn< typeof HStack > = ( props ) => {
	return (
		<HStack
			style={ { background: '#eee', minHeight: '3rem' } }
			{ ...props }
		>
			{ [ 'One', 'Two', 'Three', 'Four', 'Five' ].map( ( text ) => (
				<View key={ text } style={ { background: '#b9f9ff' } }>
					{ text }
				</View>
			) ) }
		</HStack>
	);
};

export const Default: StoryFn< typeof HStack > = Template.bind( {} );
Default.args = {
	spacing: 3,
};

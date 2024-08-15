/**
 * External dependencies
 */
import type { StoryFn, Meta } from '@storybook/react';

/**
 * Internal dependencies
 */
import { View } from '../../../view';
import { VStack } from '../..';

const meta: Meta< typeof VStack > = {
	component: VStack,
	title: 'Components (Experimental)/VStack',
};
export default meta;

const Template: StoryFn< typeof VStack > = ( props ) => {
	return (
		<VStack
			{ ...props }
			style={ { background: '#eee', minHeight: '3rem' } }
		>
			{ [ 'One', 'Two', 'Three', 'Four', 'Five' ].map( ( text ) => (
				<View key={ text } style={ { background: '#b9f9ff' } }>
					{ text }
				</View>
			) ) }
		</VStack>
	);
};

export const Default: StoryFn< typeof VStack > = Template.bind( {} );
Default.args = {
	spacing: 3,
};

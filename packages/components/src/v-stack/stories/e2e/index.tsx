/**
 * External dependencies
 */
import type { ComponentStory, ComponentMeta } from '@storybook/react';

/**
 * Internal dependencies
 */
import { View } from '../../../view';
import { VStack } from '../..';

const meta: ComponentMeta< typeof VStack > = {
	component: VStack,
	title: 'Components (Experimental)/VStack',
};
export default meta;

const Template: ComponentStory< typeof VStack > = ( props ) => {
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

export const Default: ComponentStory< typeof VStack > = Template.bind( {} );
Default.args = {
	spacing: 3,
};

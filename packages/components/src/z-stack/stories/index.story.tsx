/**
 * External dependencies
 */
import type { CSSProperties } from 'react';
import type { ComponentMeta, ComponentStory } from '@storybook/react';

/**
 * Internal dependencies
 */
import { Elevation } from '../../elevation';
import { View } from '../../view';
import { ZStack } from '..';

const meta: ComponentMeta< typeof ZStack > = {
	component: ZStack,
	title: 'Components (Experimental)/ZStack',
	argTypes: {
		as: { control: { type: 'text' } },
		children: { control: { type: null } },
	},
	parameters: {
		controls: {
			expanded: true,
		},
		docs: { source: { state: 'open' } },
	},
};
export default meta;

const Avatar = ( {
	backgroundColor,
}: {
	backgroundColor: CSSProperties[ 'backgroundColor' ];
} ) => {
	return (
		<View>
			<View
				style={ {
					border: '3px solid black',
					borderRadius: '9999px',
					height: '48px',
					width: '48px',
					backgroundColor,
				} }
			/>
			<Elevation
				borderRadius={ 9999 }
				isInteractive={ false }
				value={ 3 }
			/>
		</View>
	);
};

const Template: ComponentStory< typeof ZStack > = ( args ) => {
	return (
		<ZStack { ...args }>
			<Avatar backgroundColor="#444" />
			<Avatar backgroundColor="#777" />
			<Avatar backgroundColor="#aaa" />
			<Avatar backgroundColor="#fff" />
		</ZStack>
	);
};

export const Default: ComponentStory< typeof ZStack > = Template.bind( {} );
Default.args = {
	offset: 20,
};

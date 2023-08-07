/**
 * External dependencies
 */
import type { ComponentMeta, ComponentStory } from '@storybook/react';

/**
 * Internal dependencies
 */
import Panel from '../';
import PanelRow from '../row';
import PanelBody from '../body';
import InputControl from '../../input-control';

/**
 * WordPress dependencies
 */
import { wordpress } from '@wordpress/icons';

const meta: ComponentMeta< typeof Panel > = {
	title: 'Components/Panel',
	component: Panel,
	subcomponents: { PanelRow, PanelBody },
	argTypes: {
		children: { control: { type: null } },
	},
	parameters: {
		controls: { expanded: true },
		docs: { source: { state: 'open' } },
	},
};
export default meta;

const Template: ComponentStory< typeof Panel > = ( props ) => (
	<Panel { ...props } />
);

export const Default: ComponentStory< typeof Panel > = Template.bind( {} );
Default.args = {
	header: 'My panel',
	children: (
		<>
			<PanelBody title="First section">
				<PanelRow>
					<div
						style={ {
							background: '#ddd',
							height: 100,
							width: '100%',
						} }
					/>
				</PanelRow>
			</PanelBody>
			<PanelBody title="Second section" initialOpen={ false }>
				<PanelRow>
					<div
						style={ {
							background: '#ddd',
							height: 100,
							width: '100%',
						} }
					/>
				</PanelRow>
			</PanelBody>
		</>
	),
};

/**
 * `PanelRow` is a generic container for rows within a `PanelBody`.
 * It is a flex container with a top margin for spacing.
 */
export const _PanelRow: ComponentStory< typeof Panel > = Template.bind( {} );
_PanelRow.args = {
	children: (
		<PanelBody title="My Profile">
			<PanelRow>
				<InputControl label="First name" />
				<InputControl label="Last name" />
			</PanelRow>
			<PanelRow>
				<div style={ { flex: 1 } }>
					<InputControl label="Email" />
				</div>
			</PanelRow>
		</PanelBody>
	),
};

export const DisabledSection: ComponentStory< typeof Panel > = Template.bind(
	{}
);
DisabledSection.args = {
	...Default.args,
	children: (
		<PanelBody
			title="Disabled section"
			initialOpen={ false }
			buttonProps={ { disabled: true } }
		/>
	),
};

export const WithIcon: ComponentStory< typeof Panel > = Template.bind( {} );
WithIcon.args = {
	...Default.args,
	children: (
		<PanelBody title="Section title" icon={ wordpress }>
			<PanelRow>
				<div
					style={ {
						background: '#ddd',
						height: 100,
						width: '100%',
					} }
				/>
			</PanelRow>
		</PanelBody>
	),
};

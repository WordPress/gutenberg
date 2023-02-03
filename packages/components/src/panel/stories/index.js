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

export default {
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

const Template = ( props ) => <Panel { ...props } />;

export const Default = Template.bind( {} );
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
export const _PanelRow = Template.bind( {} );
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

export const DisabledSection = Template.bind( {} );
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

export const WithIcon = Template.bind( {} );
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

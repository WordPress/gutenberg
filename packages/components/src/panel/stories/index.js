/**
 * External dependencies
 */
import { boolean, text } from '@storybook/addon-knobs';

/**
 * Internal dependencies
 */
import Panel from '../';
import PanelRow from '../row';
import PanelBody from '../body';

/**
 * WordPress dependencies
 */
import { wordpress } from '@wordpress/icons';

export default {
	title: 'Components/Panel',
	component: Panel,
	parameters: {
		knobs: { disable: false },
	},
};

export const _default = () => {
	const bodyTitle = text( 'Body Title', 'My Block Settings' );
	const opened = boolean( 'Opened', true );
	const rowText = text( 'Row Text', 'My Panel Inputs and Labels' );
	return (
		<Panel header="My Panel">
			<PanelBody title={ bodyTitle } opened={ opened }>
				<PanelRow>{ rowText }</PanelRow>
			</PanelBody>
		</Panel>
	);
};

export const multipleBodies = () => {
	return (
		<ScrollableContainer>
			<Panel header="My Panel">
				<PanelBody title="First Settings">
					<PanelRow>
						<Placeholder height={ 250 } />
					</PanelRow>
				</PanelBody>
				<PanelBody title="Second Settings" initialOpen={ false }>
					<PanelRow>
						<Placeholder height={ 400 } />
					</PanelRow>
				</PanelBody>
				<PanelBody title="Third Settings" initialOpen={ false }>
					<PanelRow>
						<Placeholder height={ 600 } />
					</PanelRow>
				</PanelBody>
				<PanelBody title="Fourth Settings" initialOpen={ false }>
					<PanelRow>
						<Placeholder />
					</PanelRow>
				</PanelBody>
				<PanelBody
					title="Disabled Settings"
					initialOpen={ false }
					buttonProps={ { disabled: true } }
				/>
			</Panel>
		</ScrollableContainer>
	);
};

export const withIcon = () => {
	const bodyTitle = text( 'Body Title', 'My Block Settings' );
	const rowText = text( 'Row Text', 'My Panel Inputs and Labels' );
	const icon = boolean( 'Icon', true ) ? wordpress : undefined;
	const opened = boolean( 'Opened', true );
	return (
		<Panel header="My Panel">
			<PanelBody title={ bodyTitle } opened={ opened } icon={ icon }>
				<PanelRow>{ rowText }</PanelRow>
			</PanelBody>
		</Panel>
	);
};

function ScrollableContainer( { children } ) {
	return (
		<div
			style={ {
				width: 300,
				height: '100vh',
				overflowY: 'auto',
				margin: 'auto',
				boxShadow: '0 0 0 1px #ddd inset',
			} }
		>
			{ children }
		</div>
	);
}

function Placeholder( { height = 200 } ) {
	return <div style={ { background: '#ddd', height, width: '100%' } } />;
}

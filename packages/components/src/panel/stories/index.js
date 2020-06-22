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

export default { title: 'Components/Panel', component: Panel };

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
	const body1Title = text( '1: Body Title', 'First Settings' );
	const body2Title = text( '2: Body Title', 'Second Settings' );
	const body1Open = boolean( '1: Opened', true );
	const body2Open = boolean( '2: Opened', false );
	const row1Text = text( '1: Row Text', 'My Panel Inputs and Labels' );
	const row2Text = text( '2: Row Text', 'My Panel Inputs and Labels' );
	return (
		<Panel header="My Panel">
			<PanelBody title={ body1Title } opened={ body1Open }>
				<PanelRow>{ row1Text }</PanelRow>
			</PanelBody>
			<PanelBody title={ body2Title } opened={ body2Open }>
				<PanelRow>{ row2Text }</PanelRow>
			</PanelBody>
		</Panel>
	);
};

export const withIcon = () => {
	const bodyTitle = text( 'Body Title', 'My Block Settings' );
	const rowText = text( 'Row Text', 'My Panel Inputs and Labels' );
	const icon = text( 'Icon', 'wordpress' );
	const opened = boolean( 'Opened', true );
	return (
		<Panel header="My Panel">
			<PanelBody title={ bodyTitle } opened={ opened } icon={ icon }>
				<PanelRow>{ rowText }</PanelRow>
			</PanelBody>
		</Panel>
	);
};

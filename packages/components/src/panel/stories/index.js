/**
 * External dependencies
 */
import { text } from '@storybook/addon-knobs';

/**
 * Internal dependencies
 */
import Panel from '../';
import PanelRow from '../row';
import PanelBody from '../body';

export default { title: 'Components|Panel', component: Panel };

export const _default = () => {
	const bodyTitle = text( 'Body Title', 'My Block Settings' );
	const rowText = text( 'Row Text', 'My Panel Inputs and Labels' );
	return (
		<Panel header="My Panel">
			<PanelBody
				title={ bodyTitle }
				initialOpen={ true }
			>
				<PanelRow>
					{ rowText }
				</PanelRow>
			</PanelBody>
		</Panel>
	);
};

export const multipleBodies = () => {
	const body1Title = text( 'Body 1 Title', 'First Settings' );
	const body2Title = text( 'Body 2 Title', 'Second Settings' );
	const row1Text = text( 'Row Text', 'My Panel Inputs and Labels' );
	const row2Text = text( 'Row Text', 'My Panel Inputs and Labels' );
	return (
		<Panel header="My Panel">
			<PanelBody
				title={ body1Title }
				initialOpen={ true }
			>
				<PanelRow>
					{ row1Text }
				</PanelRow>
			</PanelBody>
			<PanelBody
				title={ body2Title }
				initialOpen={ false }
			>
				<PanelRow>
					{ row2Text }
				</PanelRow>
			</PanelBody>
		</Panel>
	);
};

export const withIcon = () => {
	const bodyTitle = text( 'Body Title', 'My Block Settings' );
	const rowText = text( 'Row Text', 'My Panel Inputs and Labels' );
	const icon = text( 'Icon', 'wordpress' );
	return (
		<Panel header="My Panel">
			<PanelBody
				title={ bodyTitle }
				initialOpen={ true }
				icon={ icon }
			>
				<PanelRow>
					{ rowText }
				</PanelRow>
			</PanelBody>
		</Panel>
	);
};

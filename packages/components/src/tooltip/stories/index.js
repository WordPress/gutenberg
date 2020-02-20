/**
 * External dependencies
 */
import { text } from '@storybook/addon-knobs';

/**
 * Internal dependencies
 */
import Tooltip from '../';
import Button from '../../button';

export default {
	title: 'Components/ToolTip',
	component: Tooltip,
};

export const _default = () => {
	const tooltipText = text( 'Text', 'More information' );
	return (
		<Tooltip text={ tooltipText }>
			<Button isSecondary>Hover for more information</Button>
		</Tooltip>
	);
};

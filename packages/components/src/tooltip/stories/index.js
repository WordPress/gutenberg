/**
 * External dependencies
 */
import { text, select } from '@storybook/addon-knobs';

/**
 * Internal dependencies
 */
import Tooltip from '../';

export default {
	title: 'Components/ToolTip',
	component: Tooltip,
};

export const _default = () => {
	const tooltipText = text( 'Text', 'More information' );
	return (
		<Tooltip text={ tooltipText }>
			<div
				style={ {
					margin: '100px',
					textAlign: 'center',
					border: '1px solid #ccc',
				} }
			>
				Hover for more information
			</div>
		</Tooltip>
	);
};
export const withPosition = () => {
	const positionOptions = {
		'top left': 'top left',
		'top center ': 'top center',
		'top right': 'top right',
		'bottom left': 'bottom left',
		'bottom center ': 'bottom center',
		'bottom right': 'bottom right',
	};
	const tooltipText = text( 'Text', 'More information' );
	const position = select( 'Position', positionOptions, 'top center' );
	return (
		<Tooltip text={ tooltipText } position={ position }>
			<div
				style={ {
					margin: '100px',
					textAlign: 'center',
					border: '1px solid #ccc',
				} }
			>
				Hover for more information
			</div>
		</Tooltip>
	);
};

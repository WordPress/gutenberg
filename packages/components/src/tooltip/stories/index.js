/**
 * External dependencies
 */
import styled from '@emotion/styled';
import { text, select, number } from '@storybook/addon-knobs';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Tooltip from '../';

export default {
	title: 'Components/ToolTip',
	component: Tooltip,
	parameters: {
		knobs: { disable: false },
	},
};

export const _default = () => {
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
	const delay = number( 'Delay', 700 );
	return (
		<Tooltip text={ tooltipText } position={ position } delay={ delay }>
			<div
				style={ {
					margin: '50px auto',
					width: '200px',
					padding: '20px',
					textAlign: 'center',
					border: '1px solid #ccc',
				} }
			>
				Hover for more information
			</div>
		</Tooltip>
	);
};

const Button = styled.button`
	margin: 0 10px;
`;

export const DisabledElement = () => {
	const [ showMessage, toggleMessage ] = useState( false );

	return (
		<>
			<Tooltip text="Hey, I am tooltip" position="bottom center">
				<Button onClick={ () => toggleMessage( ! showMessage ) }>
					Hover me!
				</Button>
			</Tooltip>
			<Tooltip text="Hey, I am tooltip" position="bottom center">
				<Button
					disabled
					onClick={ () => toggleMessage( ! showMessage ) }
				>
					Hover me, but I am disabled
				</Button>
			</Tooltip>
			<br />
			{ showMessage ? <p>Hello World!</p> : null }
		</>
	);
};

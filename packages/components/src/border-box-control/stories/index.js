/**
 * External dependencies
 */
import styled from '@emotion/styled';

/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Button from '../../button';
import Popover from '../../popover';
import { BorderBoxControl } from '../';
import { Provider as SlotFillProvider } from '../../slot-fill';

// Available border colors.
const colors = [
	{ name: 'Gray 0', color: '#f6f7f7' },
	{ name: 'Gray 5', color: '#dcdcde' },
	{ name: 'Gray 20', color: '#a7aaad' },
	{ name: 'Gray 70', color: '#3c434a' },
	{ name: 'Gray 100', color: '#101517' },
	{ name: 'Blue 20', color: '#72aee6' },
	{ name: 'Blue 40', color: '#3582c4' },
	{ name: 'Blue 70', color: '#0a4b78' },
	{ name: 'Red 40', color: '#e65054' },
	{ name: 'Red 70', color: '#8a2424' },
	{ name: 'Green 10', color: '#68de7c' },
	{ name: 'Green 40', color: '#00a32a' },
	{ name: 'Green 60', color: '#007017' },
	{ name: 'Yellow 10', color: '#f2d675' },
	{ name: 'Yellow 40', color: '#bd8600' },
];

export default {
	title: 'Components (Experimental)/BorderBoxControl',
	component: BorderBoxControl,
	parameters: {
		knobs: { disable: false },
	},
};

const _default = ( props ) => {
	const { defaultBorder } = props;
	const [ borders, setBorders ] = useState( defaultBorder );

	useEffect( () => setBorders( defaultBorder ), [ defaultBorder ] );

	return (
		<SlotFillProvider>
			<WrapperView>
				<BorderBoxControl
					colors={ colors }
					label="Borders"
					onChange={ ( newBorders ) => setBorders( newBorders ) }
					value={ borders }
					{ ...props }
				/>
			</WrapperView>
			<Separator />
			<HelpText>
				The BorderBoxControl is intended to be used within a component
				that will provide reset controls. The button below is only for
				convenience.
			</HelpText>
			<Button variant="primary" onClick={ () => setBorders( undefined ) }>
				Reset
			</Button>
			<Popover.Slot />
		</SlotFillProvider>
	);
};

export const Default = _default.bind( {} );
Default.args = {
	disableCustomColors: false,
	enableAlpha: true,
	enableStyle: true,
	defaultBorder: {
		color: '#72aee6',
		style: 'dashed',
		width: '1px',
	},
};

const WrapperView = styled.div`
	max-width: 280px;
	padding: 16px;
`;

const Separator = styled.hr`
	margin-top: 100px;
	border-color: #ddd;
	border-style: solid;
	border-bottom: none;
`;

const HelpText = styled.p`
	color: #aaa;
	font-size: 0.9em;
`;

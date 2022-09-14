/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';
import { Icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import AlignmentMatrixControl from '../';
import { ALIGNMENTS } from '../utils';
import { HStack } from '../../h-stack';

export default {
	title: 'Components (Experimental)/AlignmentMatrixControl',
	component: AlignmentMatrixControl,
	subcomponents: {
		'AlignmentMatrixControl.Icon': AlignmentMatrixControl.Icon,
	},
	argTypes: {
		defaultValue: { options: ALIGNMENTS },
		onChange: { action: 'onChange', control: { type: null } },
		label: { control: { type: 'text' } },
		width: { control: { type: 'number' } },
		value: { control: { type: null } },
	},
	parameters: {
		controls: { expanded: true },
		docs: { source: { state: 'open' } },
	},
};

const Template = ( { defaultValue, onChange, ...props } ) => {
	const [ value, setValue ] = useState();

	// Convenience handler for Canvas view so changes are reflected
	useEffect( () => {
		setValue( defaultValue );
	}, [ defaultValue ] );

	return (
		<AlignmentMatrixControl
			{ ...props }
			onChange={ ( ...changeArgs ) => {
				setValue( ...changeArgs );
				onChange( ...changeArgs );
			} }
			value={ value }
		/>
	);
};
export const Default = Template.bind( {} );

export const IconSubcomponent = () => {
	return (
		<HStack justify="flex-start">
			<Icon
				icon={
					<AlignmentMatrixControl.Icon size={ 24 } value="top left" />
				}
			/>
			<Icon
				icon={
					<AlignmentMatrixControl.Icon
						size={ 24 }
						value="center center"
					/>
				}
			/>
		</HStack>
	);
};

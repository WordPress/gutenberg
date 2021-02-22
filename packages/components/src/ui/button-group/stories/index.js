/**
 * WordPress dependencies
 */
import { formatBold, formatItalic, formatUnderline } from '@wordpress/icons';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Button } from '../../button';
import { ButtonGroup } from '..';

export default {
	component: ButtonGroup,
	title: 'G2 Components (Experimental)/ButtonGroup',
};

export const _default = () => {
	const [ value, setValue ] = useState( 'bold' );

	return (
		<ButtonGroup onChange={ setValue } value={ value }>
			<Button icon={ formatBold } value="bold" />
			<Button icon={ formatItalic } value="italic" />
			<Button icon={ formatUnderline } value="underline" />
		</ButtonGroup>
	);
};

export const _expanded = () => {
	const [ value, setValue ] = useState( 'bold' );

	return (
		<>
			<ButtonGroup expanded onChange={ setValue } value={ value }>
				<Button icon={ formatBold } value="bold" />
				<Button icon={ formatItalic } value="italic" />
				<Button icon={ formatUnderline } value="underline" />
			</ButtonGroup>
		</>
	);
};

export const _segmented = () => {
	const [ value, setValue ] = useState( 'bold' );

	return (
		<>
			<ButtonGroup onChange={ setValue } segmented value={ value }>
				<Button icon={ formatBold } value="bold" />
				<Button icon={ formatItalic } value="italic" />
				<Button icon={ formatUnderline } value="underline" />
			</ButtonGroup>
		</>
	);
};

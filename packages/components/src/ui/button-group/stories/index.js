/**
 * External dependencies
 */
import { boolean } from '@storybook/addon-knobs';
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
	const props = {
		expanded: boolean( 'expanded', false ),
		segmented: boolean( 'segmented', false ),
	};

	return (
		<ButtonGroup onChange={ setValue } value={ value } { ...props }>
			<Button icon={ formatBold } value="bold" />
			<Button icon={ formatItalic } value="italic" />
			<Button icon={ formatUnderline } value="underline" />
		</ButtonGroup>
	);
};

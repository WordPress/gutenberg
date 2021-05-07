/**
 * External dependencies
 */
import { number } from '@storybook/addon-knobs';

/**
 * Internal dependencies
 */
import { Separator } from '..';
import { Text } from '../../text';

export default {
	component: Separator,
	title: 'Components (Experimental)/Separator',
};

export const _default = () => {
	const separatorProps = {
		marginTop: number( 'marginTop', undefined ),
		marginBottom: number( 'marginBottom', undefined ),
	};
	return (
		<>
			<Text>WordPress.org</Text>
			<Separator { ...separatorProps } />
			<Text>Code is Poetry</Text>
		</>
	);
};

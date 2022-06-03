/**
 * External dependencies
 */
import { css } from '@emotion/react';
import type { Meta, Story } from '@storybook/react';

/**
 * Internal dependencies
 */
import { useCx } from '../../utils';
import { space } from '../../ui/utils/space';
import Spinner from '../';

const sizes = {
	default: undefined,
	medium: space( 20 ),
	large: space( 40 ),
};

const meta: Meta<
	typeof Spinner & { size: 'default' | 'medium' | 'large' }
> = {
	title: 'Components/Spinner',
	component: Spinner,
	argTypes: {
		size: {
			options: Object.keys( sizes ),
			mapping: sizes,
			control: { type: 'select' },
		},
	},
};
export default meta;

const Template: Story<
	typeof Spinner & { size: 'default' | 'medium' | 'large' }
> = ( { size } ) => {
	const cx = useCx();
	const spinnerClassname = cx( css`
		width: ${ size };
		height: ${ size };
	` );
	return <Spinner className={ spinnerClassname } />;
};

export const Default: Story<
	typeof Spinner & { size: 'default' | 'medium' | 'large' }
> = Template.bind( {} );
Default.args = {
	size: 'default',
};

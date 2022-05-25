/**
 * External dependencies
 */
import { css } from '@emotion/react';

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

export default {
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

const Template = ( { size } ) => {
	const cx = useCx();
	const spinnerClassname = cx( css`
		width: ${ size };
		height: ${ size };
	` );
	return <Spinner className={ spinnerClassname } />;
};

export const Default = Template.bind( {} );
Default.args = {
	size: 'default',
};

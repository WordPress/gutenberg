/**
 * External dependencies
 */
import styled from '@emotion/styled';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { UnitRangeControl } from '../';

export default {
	title: 'Components (Experimental)/UnitRangeControl',
	component: UnitRangeControl,
};

const _default = ( props ) => {
	const [ value, setValue ] = useState();

	return (
		<WrapperView>
			<UnitRangeControl
				{ ...props }
				label="Unit + Range Control"
				onChange={ setValue }
				value={ value }
			/>
		</WrapperView>
	);
};

export const Default = _default.bind( {} );
Default.args = {
	unitControlProps: {},
	rangeControlProps: {},
};

const WrapperView = styled.div`
	max-width: 280px;
`;

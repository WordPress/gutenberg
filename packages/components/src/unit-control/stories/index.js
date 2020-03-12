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
import UnitControl from '../';

export default {
	title: 'Components/UnitControl',
	component: UnitControl,
};

function Example() {
	const [ value, setValue ] = useState( '' );
	const [ unit, setUnit ] = useState( 'px' );

	return (
		<ControlWrapperView>
			<UnitControl
				value={ value }
				onChange={ setValue }
				unit={ unit }
				onUnitChange={ setUnit }
			/>
		</ControlWrapperView>
	);
}

export const _default = () => {
	return (
		<Wrapper>
			<Example />
		</Wrapper>
	);
};

const Wrapper = styled.div`
	padding: 40px;
`;

const ControlWrapperView = styled.div`
	max-width: 80px;
`;

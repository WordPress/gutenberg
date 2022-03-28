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
import BoxControl from '../';
import BoxControlVisualizer from '../visualizer';
import { Flex, FlexBlock } from '../../flex';

export default {
	title: 'Components (Experimental)/BoxControl',
	component: BoxControl,
};

export const _default = () => {
	return <BoxControl />;
};

const defaultSideValues = {
	top: '10px',
	right: '10px',
	bottom: '10px',
	left: '10px',
};

function DemoExample( {
	sides,
	defaultValues = defaultSideValues,
	splitOnAxis = false,
} ) {
	const [ values, setValues ] = useState( defaultValues );
	const [ showVisualizer, setShowVisualizer ] = useState( {} );

	return (
		<Container align="top" gap={ 8 }>
			<FlexBlock>
				<Content>
					<BoxControl
						label="Padding"
						values={ values }
						sides={ sides }
						onChange={ setValues }
						onChangeShowVisualizer={ setShowVisualizer }
						splitOnAxis={ splitOnAxis }
					/>
				</Content>
			</FlexBlock>
			<FlexBlock>
				<Content>
					<BoxContainer>
						<BoxControlVisualizer
							showValues={ showVisualizer }
							values={ values }
						>
							<Box />
						</BoxControlVisualizer>
					</BoxContainer>
				</Content>
			</FlexBlock>
		</Container>
	);
}

export const visualizer = () => {
	return <DemoExample />;
};

export const arbitrarySides = () => {
	return (
		<DemoExample
			sides={ [ 'top', 'bottom' ] }
			defaultValues={ { top: '10px', bottom: '10px' } }
		/>
	);
};

export const singleSide = () => {
	return (
		<DemoExample
			sides={ [ 'bottom' ] }
			defaultValues={ { bottom: '10px' } }
		/>
	);
};

export const axialControls = () => {
	return <DemoExample splitOnAxis={ true } />;
};

export const axialControlsWithSingleSide = () => {
	return (
		<DemoExample
			sides={ [ 'horizontal' ] }
			defaultValues={ { left: '10px', right: '10px' } }
			splitOnAxis={ true }
		/>
	);
};

const Container = styled( Flex )`
	max-width: 780px;
`;

const BoxContainer = styled.div`
	width: 300px;
	height: 300px;
`;

const Box = styled.div`
	background: #ddd;
	height: 300px;
`;

const Content = styled.div`
	padding: 20px;
`;

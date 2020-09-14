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

export default { title: 'Components/BoxControl', component: BoxControl };

export const _default = () => {
	return <BoxControl />;
};

function DemoExample() {
	const [ values, setValues ] = useState( {
		top: '10px',
		right: '10px',
		bottom: '10px',
		left: '10px',
	} );

	const [ showVisualizer, setShowVisualizer ] = useState( {} );

	return (
		<Container align="top" gap={ 8 }>
			<FlexBlock>
				<Content>
					<BoxControl
						label="Padding"
						values={ values }
						onChange={ setValues }
						onChangeShowVisualizer={ setShowVisualizer }
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

function CustomBoxIcon( { side } ) {
	let icon = '✊';
	switch ( side ) {
		case 'top':
			icon = '☝️';
			break;
		case 'bottom':
			icon = '👇';
			break;
		case 'left':
			icon = '👈';
			break;
		case 'right':
			icon = '👉';
			break;
	}
	return (
		<div
			style={ {
				fontSize: 18,
				lineHeight: 1,
				width: 24,
				height: 24,
				padding: 2,
			} }
		>
			<span role="img" alt="icon">
				{ icon }
			</span>
		</div>
	);
}

export const customIcon = () => {
	return <BoxControl iconComponent={ CustomBoxIcon } />;
};

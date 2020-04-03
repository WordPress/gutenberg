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
import BoxControlIcon from '../icon';
import { Flex, FlexBlock } from '../../flex';

export default { title: 'Components/BoxControl', component: BoxControl };

export const _default = () => {
	return <BoxControl />;
};

export const icon = () => {
	return <BoxControlIcon />;
};

function DemoExample() {
	const [ values, setValues ] = useState( {
		top: [ 10 ],
		right: [ 10 ],
		bottom: [ 10 ],
		left: [ 10 ],
	} );
	const top = values?.top?.[ 0 ];
	const right = values?.right?.[ 0 ];
	const bottom = values?.bottom?.[ 0 ];
	const left = values?.left?.[ 0 ];

	return (
		<Container align="top" gap={ 8 }>
			<FlexBlock>
				<Content>
					<BoxControl
						label="Padding"
						values={ values }
						onChange={ setValues }
					/>
				</Content>
			</FlexBlock>
			<FlexBlock>
				<Content>
					<Box>
						<Padding
							style={ {
								top: 0,
								left: 0,
								width: '100%',
								padding: top,
							} }
						/>
						<Padding
							style={ {
								top: 0,
								right: 0,
								height: '100%',
								padding: right,
							} }
						/>
						<Padding
							style={ {
								bottom: 0,
								left: 0,
								width: '100%',
								padding: bottom,
							} }
						/>
						<Padding
							style={ {
								top: 0,
								left: 0,
								height: '100%',
								padding: left,
							} }
						/>
					</Box>
				</Content>
			</FlexBlock>
		</Container>
	);
}

export const demo = () => {
	return <DemoExample />;
};

const Container = styled( Flex )`
	max-width: 780px;
`;

const Box = styled.div`
	width: 300px;
	height: 300px;
	position: relative;
`;

const Padding = styled.div`
	position: absolute;
	background: blue;
	opacity: 0.2;
`;

const Content = styled.div`
	padding: 20px;
`;

/**
 * External dependencies
 */
import { boolean, number, select } from '@storybook/addon-knobs';
import { random } from 'lodash';
/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { arrowLeft } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import Button from '../../button';
import Flex from '../flex';
import FlexBlock from '../block';
import FlexItem from '../item';

import './style.css';

export default { title: 'Components/Flex', component: Flex };

const getStoryProps = () => {
	const showOutline = boolean( 'Example: Show Outline', true );

	const align = select(
		'align',
		{
			top: 'top',
			center: 'center',
			bottom: 'bottom',
		},
		'center'
	);

	const gap = number( 'gap', 1 );

	const justify = select(
		'justify',
		{
			'space-between': 'space-between',
			left: 'left',
			center: 'center',
			right: 'right',
		},
		'space-between'
	);

	return {
		showOutline,
		align,
		gap,
		justify,
	};
};

const Box = ( props ) => {
	const { height, width, style: styleProps = {} } = props;

	const style = {
		background: '#ddd',
		fontSize: 12,
		...styleProps,
		height: height || 40,
		width: width || '100%',
	};

	return <div { ...props } style={ style } />;
};

const EnhancedFlex = ( props ) => {
	const { showOutline, ...restProps } = props;
	const exampleClassName = showOutline ? 'example-only-show-outline' : '';

	return <Flex { ...restProps } className={ exampleClassName } />;
};

export const _default = () => {
	const showBlock = boolean( 'Example: Show Block', true );
	const differSize = boolean( 'Example: Differ Sizes', true );
	const props = getStoryProps();

	const baseSize = 40;

	return (
		<EnhancedFlex { ...props }>
			<FlexItem>
				<Box
					width={ differSize ? 100 : baseSize }
					height={ differSize ? 100 : baseSize }
				>
					Item
				</Box>
			</FlexItem>
			{ showBlock && (
				<FlexBlock>
					<Box height={ differSize ? 300 : null }>Block</Box>
				</FlexBlock>
			) }

			<FlexItem>
				<Box width={ 40 }>Item</Box>
			</FlexItem>
		</EnhancedFlex>
	);
};

const ItemExample = () => {
	const props = getStoryProps();

	const [ items, setItems ] = useState( [
		{
			width: 40,
			height: 40,
		},
	] );

	const addItem = () => {
		setItems( [
			...items,
			{ width: random( 12, 150 ), height: random( 12, 150 ) },
		] );
	};

	const removeItem = () => {
		const nextItems = items.filter( ( item, index ) => {
			return index !== items.length - 1;
		} );
		setItems( nextItems );
	};

	return (
		<div>
			<Flex justify="left" gap="small">
				<FlexItem>
					<Button onClick={ addItem } isSecondary>
						Add Item
					</Button>
				</FlexItem>
				<FlexItem>
					<Button onClick={ removeItem } isSecondary>
						Remove Item
					</Button>
				</FlexItem>
			</Flex>
			<hr />
			<EnhancedFlex { ...props }>
				{ items.map( ( item, index ) => (
					<FlexItem key={ index }>
						<Box { ...item } />
					</FlexItem>
				) ) }
			</EnhancedFlex>
		</div>
	);
};

export const flexItem = () => {
	return <ItemExample />;
};

const BlockExample = () => {
	const props = getStoryProps();

	const [ items, setItems ] = useState( [
		{
			height: 40,
		},
	] );

	const addItem = () => {
		setItems( [ ...items, { height: random( 20, 150 ) } ] );
	};

	const removeItem = () => {
		const nextItems = items.filter( ( item, index ) => {
			return index !== items.length - 1;
		} );
		setItems( nextItems );
	};

	return (
		<div>
			<Flex justify="left" gap="small">
				<FlexItem>
					<Button onClick={ addItem } isSecondary>
						Add Block
					</Button>
				</FlexItem>
				<FlexItem>
					<Button onClick={ removeItem } isSecondary>
						Remove Blcok
					</Button>
				</FlexItem>
			</Flex>
			<hr />
			<EnhancedFlex { ...props }>
				<FlexItem>
					<Box width={ 40 } height={ 40 } />
				</FlexItem>
				{ items.map( ( item, index ) => (
					<FlexBlock key={ index }>
						<Box { ...item } />
					</FlexBlock>
				) ) }
				<FlexItem>
					<Box width={ 40 } height={ 40 } />
				</FlexItem>
			</EnhancedFlex>
		</div>
	);
};

export const flexBlock = () => {
	return <BlockExample />;
};

export const exampleActions = () => {
	const props = getStoryProps();

	return (
		<EnhancedFlex { ...props }>
			<FlexItem>
				<Button icon={ arrowLeft } isTertiary />
			</FlexItem>
			<FlexItem>
				<Flex justify="left" gap="small">
					<FlexItem>
						<Button isSecondary isPrimary>
							Add
						</Button>
					</FlexItem>
					<FlexItem>
						<Button isSecondary>Remove Item</Button>
					</FlexItem>
				</Flex>
			</FlexItem>
		</EnhancedFlex>
	);
};

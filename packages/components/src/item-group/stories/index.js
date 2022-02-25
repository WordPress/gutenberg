/* eslint-disable no-alert */
/* globals alert */
/**
 * External dependencies
 */
import { boolean, select } from '@storybook/addon-knobs';
import { css } from '@emotion/react';
import styled from '@emotion/styled';

/**
 * WordPress dependencies
 */
import { typography, chevronRight } from '@wordpress/icons';
import { useMemo } from '@wordpress/element';
import { isRTL } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useCx } from '../../utils';
import { ItemGroup, Item } from '..';
import Button from '../../button';
import { FlexItem, FlexBlock } from '../../flex';
import { Flyout } from '../../flyout';
import { HStack } from '../../h-stack';
import Icon from '../../icon';
import { Text } from '../../text';
import { Truncate } from '../../truncate';
import { ZStack } from '../../z-stack';

export default {
	component: ItemGroup,
	title: 'Components (Experimental)/ItemGroup',
	parameters: {
		knobs: { disable: false },
	},
};

// Using `unset` instead of `undefined` as Storybook seems to sometimes pass an
// empty string instead of `undefined`, which is not ideal.
// https://github.com/storybookjs/storybook/issues/800
const PROP_UNSET = 'unset';

export const _default = () => {
	const itemGroupProps = {
		isBordered: boolean( 'ItemGroup: isBordered', false ),
		isSeparated: boolean( 'ItemGroup: isSeparated', false ),
		isRounded: boolean( 'ItemGroup: isRounded', true ),
		size: select(
			'ItemGroup: size',
			[ 'small', 'medium', 'large' ],
			'medium'
		),
	};

	const itemProps = {
		size: select(
			'Item 1: size',
			{
				'unset (defaults to the value set on the <ItemGroup> parent)': PROP_UNSET,
				small: 'small',
				medium: 'medium',
				large: 'large',
			},
			PROP_UNSET
		),
	};

	// Do not pass the `size` prop when its value is `undefined`.
	// This allows the `Item` component to use the values that are set on the
	// parent `ItemGroup` component by default.
	if ( itemProps.size === PROP_UNSET ) {
		delete itemProps.size;
	}

	return (
		<ItemGroup style={ { width: '350px' } } { ...itemGroupProps }>
			<Item { ...itemProps }>Code is Poetry (no click handlers)</Item>
			<Item onClick={ () => alert( 'WordPress.org' ) }>
				Code is Poetry — Click me!
			</Item>
			<Item onClick={ () => alert( 'WordPress.org' ) }>
				Code is Poetry — Click me!
			</Item>
			<Item onClick={ () => alert( 'WordPress.org' ) }>
				Code is Poetry — Click me!
			</Item>
		</ItemGroup>
	);
};

export const dropdown = () => (
	<Flyout
		style={ { width: '350px' } }
		trigger={ <Button>Open Popover</Button> }
	>
		<ItemGroup style={ { padding: 4 } }>
			<Item>Code is Poetry (no click handlers)</Item>
			<Item onClick={ () => alert( 'WordPress.org' ) }>
				Code is Poetry — Click me!
			</Item>
			<Item onClick={ () => alert( 'WordPress.org' ) }>
				Code is Poetry — Click me!
			</Item>
			<Item onClick={ () => alert( 'WordPress.org' ) }>
				Code is Poetry — Click me!
			</Item>
		</ItemGroup>
	</Flyout>
);

const SimpleColorSwatch = ( { color, style } ) => (
	<div
		style={ {
			...style,
			borderRadius: '50%',
			border: '1px solid rgba(0, 0, 0, 0.2)',
			width: '24px',
			height: '24px',
			backgroundColor: color,
		} }
	/>
);

const ChevronWrapper = styled( FlexItem )`
	display: block;
	fill: currentColor;
	transition: transform 0.15s ease-out;
`;

const ItemWithChevron = ( {
	children,
	className,
	alwaysVisible,
	...otherProps
} ) => {
	const isRtlLayout = isRTL();
	const cx = useCx();

	const appearingChevron = css`
		&:not( :hover ):not( :focus ) ${ ChevronWrapper } {
			display: none;
		}
	`;

	const itemClassName = useMemo(
		() => cx( ! alwaysVisible && appearingChevron, className ),
		[ alwaysVisible, className, cx ]
	);

	const chevronIconClassName = useMemo(
		() =>
			cx( css`
				display: block;
				fill: currentColor;
				transform: ${ isRtlLayout ? 'scaleX( -100% )' : 'none' };
			` ),
		[ cx, isRtlLayout ]
	);

	return (
		<Item { ...otherProps } className={ itemClassName }>
			<HStack justify="flex-start">
				<FlexBlock>{ children }</FlexBlock>
				<ChevronWrapper>
					<Icon
						className={ chevronIconClassName }
						icon={ chevronRight }
						size={ 24 }
					/>
				</ChevronWrapper>
			</HStack>
		</Item>
	);
};

export const complexLayouts = () => {
	const colors = [
		{
			color: '#00A19D',
			id: 'teal',
		},
		{
			color: '#FFF8E5',
			id: 'cream',
		},
		{
			color: '#FFB344',
			id: 'yellow',
		},
		{
			color: '#E05D5D',
			id: 'red',
		},
	];

	return (
		<ItemGroup isBordered isSeparated style={ { width: '250px' } }>
			<Item onClick={ () => alert( 'Color palette' ) }>
				<HStack>
					<FlexBlock>
						<ZStack isLayered={ false } offset={ -8 }>
							{ colors.map( ( { color, id } ) => (
								<SimpleColorSwatch key={ id } color={ color } />
							) ) }
						</ZStack>
					</FlexBlock>
					<FlexItem as={ Text } variant="muted">
						23 colors
					</FlexItem>
				</HStack>
			</Item>

			<Item onClick={ () => alert( 'Single color setting' ) }>
				<HStack justify="flex-start">
					<FlexItem
						as={ SimpleColorSwatch }
						color="#22577A"
						style={ { flexShrink: 0 } }
					/>
					<FlexItem as={ Truncate }>
						Single color setting with very long description
					</FlexItem>
				</HStack>
			</Item>

			<Item onClick={ () => alert( 'Single typography setting' ) }>
				<HStack justify="flex-start">
					<FlexItem>
						<Icon icon={ typography } size={ 24 } />
					</FlexItem>
					<FlexItem as={ Truncate }>
						Single typography setting
					</FlexItem>
				</HStack>
			</Item>

			<ItemWithChevron onClick={ () => alert( 'Single color setting' ) }>
				<HStack justify="flex-start">
					<SimpleColorSwatch
						color="#2FB63F"
						style={ { flexShrink: 0 } }
					/>

					<Truncate>Chevron on hover and focus</Truncate>
				</HStack>
			</ItemWithChevron>

			<ItemWithChevron
				alwaysVisible
				onClick={ () => alert( 'Single color setting' ) }
			>
				<HStack justify="flex-start">
					<SimpleColorSwatch
						color="#D175D0"
						style={ { flexShrink: 0 } }
					/>

					<Truncate>Chevron always visible</Truncate>
				</HStack>
			</ItemWithChevron>
		</ItemGroup>
	);
};
/* eslint-enable no-alert */

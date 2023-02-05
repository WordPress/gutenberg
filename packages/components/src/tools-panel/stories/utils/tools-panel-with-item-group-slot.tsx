/**
 * External dependencies
 */
import styled from '@emotion/styled';
import { css } from '@emotion/react';
import type { ComponentStory } from '@storybook/react';

/**
 * WordPress dependencies
 */
import { useContext, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Button from '../../../button';
import ColorIndicator from '../../../color-indicator';
import ColorPalette from '../../../color-palette';
import Dropdown from '../../../dropdown';
import Panel from '../../../panel';
import { FlexItem } from '../../../flex';
import { HStack } from '../../../h-stack';
import { Item, ItemGroup } from '../../../item-group';
import { ToolsPanel, ToolsPanelItem, ToolsPanelContext } from '../..';
import type { ToolsPanelContext as ToolsPanelContextType } from '../../types';
import {
	createSlotFill,
	Provider as SlotFillProvider,
} from '../../../slot-fill';
import { useCx } from '../../../utils';

// Available border colors.
const colors = [
	{ name: 'Gray 0', color: '#f6f7f7' },
	{ name: 'Gray 5', color: '#dcdcde' },
	{ name: 'Gray 20', color: '#a7aaad' },
	{ name: 'Gray 70', color: '#3c434a' },
	{ name: 'Gray 100', color: '#101517' },
	{ name: 'Blue 20', color: '#72aee6' },
	{ name: 'Blue 40', color: '#3582c4' },
	{ name: 'Blue 70', color: '#0a4b78' },
	{ name: 'Red 40', color: '#e65054' },
	{ name: 'Red 70', color: '#8a2424' },
	{ name: 'Green 10', color: '#68de7c' },
	{ name: 'Green 40', color: '#00a32a' },
	{ name: 'Green 60', color: '#007017' },
	{ name: 'Yellow 10', color: '#f2d675' },
	{ name: 'Yellow 40', color: '#bd8600' },
];

const { Fill, Slot } = createSlotFill( 'ToolsPanelSlot' );

// This storybook example aims to replicate a virtual bubbling SlotFill use case
// for the `ToolsPanel` when the Slot itself is an `ItemGroup`.

// In this scenario the `ToolsPanel` has to render item placeholders so fills
// maintain their order in the DOM. These placeholders in the DOM prevent the
// normal styling of the `ItemGroup` in particular the border radii on the first
// and last items. In case consumers of the ItemGroup and ToolsPanel are
// applying their own styles to these components, the ToolsPanel needs to assist
// consumers in identifying which of its visible items are first and last.

// This custom fill is required to re-establish the ToolsPanelContext for
// injected ToolsPanelItem components as they will not have access to the React
// Context as the Provider is part of the ToolsPanelItems.Slot tree.
const ToolsPanelItems = ( { children }: { children: React.ReactNode } ) => {
	return (
		<Fill>
			{ ( fillProps: ToolsPanelContextType ) => (
				<ToolsPanelContext.Provider value={ fillProps }>
					{ children }
				</ToolsPanelContext.Provider>
			) }
		</Fill>
	);
};

// This fetches the ToolsPanelContext and passes it through `fillProps` so that
// rendered fills can re-establish the `ToolsPanelContext.Provider`.
const SlotContainer = ( {
	Slot: ToolsPanelSlot,
	...props
}: {
	Slot: React.ElementType;
	[ key: string ]: any;
} ) => {
	const toolsPanelContext = useContext( ToolsPanelContext );

	return (
		<ToolsPanelSlot
			{ ...props }
			fillProps={ toolsPanelContext }
			bubblesVirtually
		/>
	);
};

// This wraps the slot with a `ToolsPanel` mimicking a real-world use case from
// the block editor.
ToolsPanelItems.Slot = ( {
	resetAll,
	panelId,
	label,
	hasInnerWrapper,
	shouldRenderPlaceholderItems,
	__experimentalFirstVisibleItemClass,
	__experimentalLastVisibleItemClass,
	...props
}: React.ComponentProps< typeof ToolsPanel > & {
	[ key: string ]: any;
} ) => (
	<ToolsPanel
		label={ label }
		resetAll={ resetAll }
		panelId={ panelId }
		hasInnerWrapper={ hasInnerWrapper }
		shouldRenderPlaceholderItems={ shouldRenderPlaceholderItems }
		__experimentalFirstVisibleItemClass={
			__experimentalFirstVisibleItemClass
		}
		__experimentalLastVisibleItemClass={
			__experimentalLastVisibleItemClass
		}
	>
		<SlotContainer { ...props } Slot={ Slot } />
	</ToolsPanel>
);

export const ToolsPanelWithItemGroupSlot: ComponentStory<
	typeof ToolsPanel
> = ( { resetAll: resetAllProp, panelId, ...props } ) => {
	const [ attributes, setAttributes ] = useState< {
		text?: string;
		background?: string;
		link?: string;
	} >( {} );
	const { text, background, link } = attributes;

	const cx = useCx();
	const slotWrapperClassName = cx( SlotWrapper );
	const itemClassName = cx( ToolsPanelItemClass );

	const resetAll: typeof resetAllProp = ( resetFilters = [] ) => {
		let newAttributes = {};

		resetFilters.forEach( ( resetFilter ) => {
			newAttributes = {
				...newAttributes,
				// TODO: the `ResetFilter` type doesn't specify any attributes
				// and doesn't return any objects
				// @ts-ignore
				...resetFilter( newAttributes ),
			};
		} );

		setAttributes( newAttributes );

		resetAllProp( resetFilters );
	};

	const updateAttribute = ( name: string, value?: any ) => {
		setAttributes( {
			...attributes,
			[ name ]: value,
		} );
	};

	const ToolsPanelColorDropdown = ( {
		attribute,
		label,
		value,
	}: {
		attribute: string;
		label: string;
		value?: string;
	} ) => {
		return (
			<ToolsPanelItem
				className={ itemClassName }
				hasValue={ () => !! value }
				label={ label }
				onDeselect={ () => updateAttribute( attribute, undefined ) }
				resetAllFilter={ () => ( { [ attribute ]: undefined } ) }
				panelId={ panelId }
				as={ Item }
			>
				<Dropdown
					renderToggle={ ( { onToggle } ) => (
						<Button onClick={ onToggle }>
							<HStack justify="flex-start">
								<ColorIndicator colorValue={ value } />
								<FlexItem>{ label }</FlexItem>
							</HStack>
						</Button>
					) }
					renderContent={ () => (
						<ColorPalette
							value={ value }
							colors={ colors }
							onChange={ ( newColor ) =>
								updateAttribute( attribute, newColor )
							}
						/>
					) }
				/>
			</ToolsPanelItem>
		);
	};

	// ToolsPanelItems are rendered via two different fills to simulate
	// injection from multiple locations.
	return (
		<SlotFillProvider>
			<PanelWrapperView>
				<Panel>
					<ToolsPanelItems.Slot
						{ ...props }
						// Not sure how to type this
						// @ts-expect-error
						as={ ItemGroup }
						isBordered
						isSeparated
						isRounded={ false }
						className={ slotWrapperClassName }
						resetAll={ resetAll }
						panelId={ panelId }
					/>
				</Panel>
			</PanelWrapperView>
			<ToolsPanelItems>
				<ToolsPanelColorDropdown
					attribute="text"
					label="Text"
					value={ text }
				/>
				<ToolsPanelColorDropdown
					attribute="background"
					label="Background"
					value={ background }
				/>
			</ToolsPanelItems>
			<ToolsPanelItems>
				<ToolsPanelColorDropdown
					attribute="link"
					label="Link"
					value={ link }
				/>
			</ToolsPanelItems>
		</SlotFillProvider>
	);
};
ToolsPanelWithItemGroupSlot.args = {
	label: 'Tools Panel with Item Group',
	panelId: 'unique-tools-panel-id',
	hasInnerWrapper: true,
	shouldRenderPlaceholderItems: true,
	__experimentalFirstVisibleItemClass: 'first',
	__experimentalLastVisibleItemClass: 'last',
};

const PanelWrapperView = styled.div`
	font-size: 13px;

	.components-dropdown-menu__menu {
		max-width: 220px;
	}
`;

const SlotWrapper = css`
	&&& {
		row-gap: 0;
		border-radius: 20px;
	}

	> div {
		grid-column: span 2;
		border-radius: inherit;
	}
`;

const ToolsPanelItemClass = css`
	padding: 0;

	&&.first {
		border-top-left-radius: inherit;
		border-top-right-radius: inherit;
	}

	&.last {
		border-bottom-left-radius: inherit;
		border-bottom-right-radius: inherit;
		border-bottom-color: transparent;
	}
	&& > div,
	&& > div > button {
		width: 100%;
		border-radius: inherit;
	}
`;

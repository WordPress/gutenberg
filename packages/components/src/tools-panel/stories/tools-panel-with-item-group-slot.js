/**
 * External dependencies
 */
import styled from '@emotion/styled';
import { css } from '@emotion/react';

/**
 * WordPress dependencies
 */
import { useContext, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import ColorIndicator from '../../color-indicator';
import ColorPalette from '../../color-palette';
import Dropdown from '../../dropdown';
import Panel from '../../panel';
import { FlexItem } from '../../flex';
import { HStack } from '../../h-stack';
import { Item, ItemGroup } from '../../item-group';
import { ToolsPanel, ToolsPanelItem, ToolsPanelContext } from '..';
import { createSlotFill, Provider as SlotFillProvider } from '../../slot-fill';
import { useCx } from '../../utils';

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
const panelId = 'unique-tools-panel-id';

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
const ToolsPanelItems = ( { children } ) => {
	return (
		<Fill>
			{ ( fillProps ) => (
				<ToolsPanelContext.Provider value={ fillProps }>
					{ children }
				</ToolsPanelContext.Provider>
			) }
		</Fill>
	);
};

// This fetches the ToolsPanelContext and passes it through `fillProps` so that
// rendered fills can re-establish the `ToolsPanelContext.Provider`.
const SlotContainer = ( { Slot: ToolsPanelSlot, ...props } ) => {
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
ToolsPanelItems.Slot = ( { resetAll, ...props } ) => (
	<ToolsPanel
		label="Tools Panel with Item Group"
		resetAll={ resetAll }
		panelId={ panelId }
		hasInnerWrapper={ true }
		shouldRenderPlaceholderItems={ true }
	>
		<SlotContainer { ...props } Slot={ Slot } />
	</ToolsPanel>
);

export const ToolsPanelWithItemGroupSlot = () => {
	const [ attributes, setAttributes ] = useState( {} );
	const { text, background, link } = attributes;

	const cx = useCx();
	const slotWrapperClassName = cx( SlotWrapper );
	const itemClassName = cx( ToolsPanelItemClass );

	const resetAll = ( resetFilters = [] ) => {
		let newAttributes = {};

		resetFilters.forEach( ( resetFilter ) => {
			newAttributes = {
				...newAttributes,
				...resetFilter( newAttributes ),
			};
		} );

		setAttributes( newAttributes );
	};

	const updateAttribute = ( name, value ) => {
		setAttributes( {
			...attributes,
			[ name ]: value,
		} );
	};

	const ToolsPanelColorDropdown = ( { attribute, label, value } ) => {
		return (
			<ToolsPanelItem
				className={ itemClassName }
				hasValue={ () => !! value }
				label={ label }
				onDeselect={ () => updateAttribute( attribute, undefined ) }
				resetAllFilter={ () => ( { [ attribute ]: undefined } ) }
				panelId={ panelId }
				as={ Dropdown }
				renderToggle={ ( { onToggle } ) => (
					<Item onClick={ onToggle }>
						<HStack justify="flex-start">
							<ColorIndicator colorValue={ value } />
							<FlexItem>{ label }</FlexItem>
						</HStack>
					</Item>
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
		);
	};

	// ToolsPanelItems are rendered via two different fills to simulate
	// injection from multiple locations.
	return (
		<SlotFillProvider>
			<PanelWrapperView>
				<Panel>
					<ToolsPanelItems.Slot
						as={ ItemGroup }
						className={ slotWrapperClassName }
						resetAll={ resetAll }
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

const PanelWrapperView = styled.div`
	max-width: 280px;
	font-size: 13px;

	.components-dropdown-menu__menu {
		max-width: 220px;
	}
`;

const SlotWrapper = css`
	&&& {
		row-gap: 0;
	}
`;

const ToolsPanelItemClass = css`
	border-left: 1px solid rgba( 0, 0, 0, 0.1 );
	border-right: 1px solid rgba( 0, 0, 0, 0.1 );
	border-bottom: 1px solid rgba( 0, 0, 0, 0.1 );

	&.first {
		border-top-left-radius: 20px;
		border-top-right-radius: 20px;
		border-top: 1px solid rgba( 0, 0, 0, 0.1 );
	}

	&.last {
		border-bottom-left-radius: 20px;
		border-bottom-right-radius: 20px;
	}

	&& > div,
	&& > div > button {
		border-radius: inherit;
	}

	/* .components-dropdown class overrides ToolsPanelItemPlaceholder styles */
	&[class*='ToolsPanelItemPlaceholder'] {
		display: none;
	}
`;

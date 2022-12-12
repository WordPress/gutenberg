/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
	__experimentalItemGroup as ItemGroup,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	__experimentalGrid as Grid,
	__experimentalHeading as Heading,
	FlexItem,
	Dropdown,
	__experimentalDropdownContentWrapper as DropdownContentWrapper,
	Button,
	BaseControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { shadow as shadowIcon } from '@wordpress/icons';
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { getSupportedGlobalStylesPanels, useStyle, useSetting } from './hooks';
import { IconWithCurrentColor } from './icon-with-current-color';

export function useHasShadowControl( name ) {
	const supports = getSupportedGlobalStylesPanels( name );
	return supports.includes( 'shadow' );
}

export default function ShadowPanel( { name, variationPath = '' } ) {
	const [ shadow, setShadow ] = useStyle( `${ variationPath }shadow`, name );
	const [ userShadow ] = useStyle( `${ variationPath }shadow`, name, 'user' );
	const hasShadow = () => !! userShadow;

	const resetShadow = () => setShadow( undefined );
	const resetAll = useCallback(
		() => resetShadow( undefined ),
		[ resetShadow ]
	);

	return (
		<ToolsPanel label={ __( 'Shadow' ) } resetAll={ resetAll }>
			<ToolsPanelItem
				label={ __( 'Drop shadow' ) }
				hasValue={ hasShadow }
				onDeselect={ resetShadow }
				isShownByDefault
			>
				<ItemGroup isBordered isSeparated>
					<ShadowPopover
						shadow={ shadow }
						onShadowChange={ setShadow }
					/>
				</ItemGroup>
			</ToolsPanelItem>
		</ToolsPanel>
	);
}

const ShadowPopover = ( { shadow, onShadowChange } ) => {
	const popoverProps = {
		placement: 'left-start',
		offset: 36,
		shift: true,
	};

	return (
		<Dropdown
			popoverProps={ popoverProps }
			className="edit-site-global-styles__shadow-dropdown"
			renderToggle={ renderShadowToggle() }
			renderContent={ () => (
				<DropdownContentWrapper paddingSize="medium">
					<ShadowPopoverContainer
						shadow={ shadow }
						onShadowChange={ onShadowChange }
					/>
				</DropdownContentWrapper>
			) }
		/>
	);
};

function renderShadowToggle() {
	return ( { onToggle, isOpen } ) => {
		const toggleProps = {
			onClick: onToggle,
			className: classnames( { 'is-open': isOpen } ),
			'aria-expanded': isOpen,
		};

		return (
			<Button { ...toggleProps }>
				<HStack justify="flex-start">
					<IconWithCurrentColor icon={ shadowIcon } size={ 24 } />
					<FlexItem className="edit-site-global-styles__shadow-label">
						{ __( 'Drop shadow' ) }
					</FlexItem>
				</HStack>
			</Button>
		);
	};
}

function ShadowPopoverContainer( { shadow, onShadowChange } ) {
	const [ defaultShadows ] = useSetting( 'shadow.presets.default' );
	const [ themeShadows ] = useSetting( 'shadow.presets.theme' );
	const [ defaultPresetsEnabled ] = useSetting( 'shadow.defaultPresets' );

	return (
		<div className="edit-site-global-styles__shadow-panel">
			<VStack spacing={ 4 }>
				<Heading level={ 5 }>{ __( 'Drop shadows' ) }</Heading>
				{ defaultPresetsEnabled && (
					<ShadowPresets
						label={ __( 'Default' ) }
						presets={ defaultShadows }
						activeShadow={ shadow }
						onSelect={ onShadowChange }
					/>
				) }
				<ShadowPresets
					label={ __( 'Theme' ) }
					presets={ themeShadows }
					activeShadow={ shadow }
					onSelect={ onShadowChange }
				/>
			</VStack>
		</div>
	);
}

function ShadowPresets( { label, presets, activeShadow, onSelect } ) {
	return ! presets ? null : (
		<div>
			<BaseControl.VisualLabel as="legend">
				{ label }
			</BaseControl.VisualLabel>

			<Grid columns={ 2 }>
				{ presets.map( ( { name, shadow }, i ) => (
					<ShadowIndicator
						key={ i }
						label={ name }
						isActive={ shadow === activeShadow }
						onSelect={ () =>
							onSelect(
								shadow === activeShadow ? undefined : shadow
							)
						}
					/>
				) ) }
			</Grid>
		</div>
	);
}

function ShadowIndicator( { label, isActive, onSelect } ) {
	return (
		<Button
			className={ classnames(
				'edit-site-global-styles__shadow-indicator',
				{ active: isActive }
			) }
			onClick={ onSelect }
		>
			{ label }
		</Button>
	);
}

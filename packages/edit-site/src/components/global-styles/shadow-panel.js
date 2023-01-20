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
import { shadow as shadowIcon, Icon, check } from '@wordpress/icons';
import { useCallback } from '@wordpress/element';
import { experiments as blockEditorExperiments } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { getSupportedGlobalStylesPanels } from './hooks';
import { IconWithCurrentColor } from './icon-with-current-color';
import { unlock } from '../../experiments';

const { useGlobalSetting, useGlobalStyle } = unlock( blockEditorExperiments );

export function useHasShadowControl( name ) {
	const supports = getSupportedGlobalStylesPanels( name );
	return supports.includes( 'shadow' );
}

export default function ShadowPanel( { name, variationPath = '' } ) {
	const [ shadow, setShadow ] = useGlobalStyle(
		`${ variationPath }shadow`,
		name
	);
	const [ userShadow ] = useGlobalStyle(
		`${ variationPath }shadow`,
		name,
		'user'
	);
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
	const [ defaultShadows ] = useGlobalSetting( 'shadow.presets.default' );
	const [ themeShadows ] = useGlobalSetting( 'shadow.presets.theme' );
	const [ defaultPresetsEnabled ] = useGlobalSetting(
		'shadow.defaultPresets'
	);

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

			<Grid columns={ 6 }>
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
						shadow={ shadow }
					/>
				) ) }
			</Grid>
		</div>
	);
}

function ShadowIndicator( { label, isActive, onSelect, shadow } ) {
	return (
		<>
			<Button
				className="edit-site-global-styles__shadow-indicator"
				onClick={ onSelect }
				aria-label={ label }
				style={ { boxShadow: shadow } }
			>
				{ isActive && <Icon icon={ check } /> }
			</Button>
		</>
	);
}

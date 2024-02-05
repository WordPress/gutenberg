/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	__experimentalVStack as VStack,
	__experimentalHeading as Heading,
	__experimentalGrid as Grid,
	__experimentalHStack as HStack,
	__experimentalDropdownContentWrapper as DropdownContentWrapper,
	Button,
	FlexItem,
	Dropdown,
} from '@wordpress/components';
import { shadow as shadowIcon, Icon, check } from '@wordpress/icons';
/**
 * External dependencies
 */
import classNames from 'classnames';

export function ShadowPopoverContainer( { shadow, onShadowChange, settings } ) {
	const defaultShadows = settings?.shadow?.presets?.default;
	const themeShadows = settings?.shadow?.presets?.theme;
	const defaultPresetsEnabled = settings?.shadow?.defaultPresets;

	const shadows = [
		...( defaultPresetsEnabled ? defaultShadows : [] ),
		...( themeShadows || [] ),
	];

	return (
		<div className="block-editor-global-styles__shadow-popover-container">
			<VStack spacing={ 4 }>
				<Heading level={ 5 }>{ __( 'Drop shadow' ) }</Heading>
				<ShadowPresets
					presets={ shadows }
					activeShadow={ shadow }
					onSelect={ onShadowChange }
				/>
			</VStack>
		</div>
	);
}

export function ShadowPresets( { presets, activeShadow, onSelect } ) {
	return ! presets ? null : (
		<Grid columns={ 6 } gap={ 0 } align="center" justify="center">
			{ presets.map( ( { name, slug, shadow } ) => (
				<ShadowIndicator
					key={ slug }
					label={ name }
					isActive={ shadow === activeShadow }
					onSelect={ () =>
						onSelect( shadow === activeShadow ? undefined : shadow )
					}
					shadow={ shadow }
				/>
			) ) }
		</Grid>
	);
}

export function ShadowIndicator( { label, isActive, onSelect, shadow } ) {
	return (
		<div className="block-editor-global-styles__shadow-indicator-wrapper">
			<Button
				className="block-editor-global-styles__shadow-indicator"
				onClick={ onSelect }
				label={ label }
				style={ { boxShadow: shadow } }
				showTooltip
			>
				{ isActive && <Icon icon={ check } /> }
			</Button>
		</div>
	);
}

export function ShadowPopover( { shadow, onShadowChange, settings } ) {
	const popoverProps = {
		placement: 'left-start',
		offset: 36,
		shift: true,
	};

	return (
		<Dropdown
			popoverProps={ popoverProps }
			className="block-editor-global-styles__shadow-dropdown"
			renderToggle={ renderShadowToggle() }
			renderContent={ () => (
				<DropdownContentWrapper paddingSize="medium">
					<ShadowPopoverContainer
						shadow={ shadow }
						onShadowChange={ onShadowChange }
						settings={ settings }
					/>
				</DropdownContentWrapper>
			) }
		/>
	);
}

function renderShadowToggle() {
	return ( { onToggle, isOpen } ) => {
		const toggleProps = {
			onClick: onToggle,
			className: classNames( { 'is-open': isOpen } ),
			'aria-expanded': isOpen,
		};

		return (
			<Button { ...toggleProps }>
				<HStack justify="flex-start">
					<Icon
						className="block-editor-global-styles__toggle-icon"
						icon={ shadowIcon }
						size={ 24 }
					/>
					<FlexItem>{ __( 'Drop shadow' ) }</FlexItem>
				</HStack>
			</Button>
		);
	};
}

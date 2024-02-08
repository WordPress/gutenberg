/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	__experimentalVStack as VStack,
	__experimentalHeading as Heading,
	__experimentalHStack as HStack,
	__experimentalDropdownContentWrapper as DropdownContentWrapper,
	Button,
	FlexItem,
	Dropdown,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { shadow as shadowIcon, Icon, check } from '@wordpress/icons';

/**
 * External dependencies
 */
import classNames from 'classnames';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const {
	CompositeV2: Composite,
	CompositeItemV2: CompositeItem,
	useCompositeStoreV2: useCompositeStore,
} = unlock( componentsPrivateApis );

export function ShadowPopoverContainer( { shadow, onShadowChange, settings } ) {
	const defaultShadows = settings?.shadow?.presets?.default || [];
	const themeShadows = settings?.shadow?.presets?.theme || [];
	const defaultPresetsEnabled = settings?.shadow?.defaultPresets;

	const shadows = [
		...( defaultPresetsEnabled ? defaultShadows : [] ),
		...themeShadows,
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
	const compositeStore = useCompositeStore();
	return ! presets ? null : (
		<Composite
			store={ compositeStore }
			role="listbox"
			className="block-editor-global-styles__shadow__list"
			aria-label={ __( 'Drop shadows' ) }
		>
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
		</Composite>
	);
}

export function ShadowIndicator( { label, isActive, onSelect, shadow } ) {
	return (
		<CompositeItem
			role="option"
			aria-label={ label }
			aria-selected={ isActive }
			className={ classNames(
				'block-editor-global-styles__shadow__item',
				{
					'is-active': isActive,
				}
			) }
			render={
				<Button
					className="block-editor-global-styles__shadow-indicator"
					onClick={ onSelect }
					label={ label }
					style={ { boxShadow: shadow } }
					showTooltip
				>
					{ isActive && <Icon icon={ check } /> }
				</Button>
			}
		/>
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

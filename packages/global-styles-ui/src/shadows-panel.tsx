/**
 * WordPress dependencies
 */
import {
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	__experimentalItemGroup as ItemGroup,
	Button,
	FlexItem,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { __, sprintf, isRTL } from '@wordpress/i18n';
import {
	plus,
	Icon,
	chevronLeft,
	chevronRight,
	moreVertical,
} from '@wordpress/icons';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Subtitle } from './subtitle';
import { NavigationButtonAsItem } from './navigation-button';
import { ScreenHeader } from './screen-header';
import { ScreenBody } from './screen-body';
import { getNewIndexFromPresets } from './utils';
import ConfirmResetShadowDialog from './confirm-reset-shadow-dialog';
import { useSetting } from './hooks';
import { unlock } from './lock-unlock';

const { Menu } = unlock( componentsPrivateApis );

export const defaultShadow = '6px 6px 9px rgba(0, 0, 0, 0.2)';

export default function ShadowsPanel() {
	const [ defaultShadows ] = useSetting( 'shadow.presets.default' );
	const [ defaultShadowsEnabled ] = useSetting( 'shadow.defaultPresets' );
	const [ themeShadows ] = useSetting( 'shadow.presets.theme' );
	const [ customShadows, setCustomShadows ] = useSetting(
		'shadow.presets.custom'
	);

	const onCreateShadow = ( shadow: any ) => {
		setCustomShadows( [ ...( customShadows || [] ), shadow ] );
	};

	const handleResetShadows = () => {
		setCustomShadows( [] );
	};

	const [ isResetDialogOpen, setIsResetDialogOpen ] = useState( false );

	const toggleResetDialog = () => setIsResetDialogOpen( ! isResetDialogOpen );

	return (
		<>
			{ isResetDialogOpen && (
				<ConfirmResetShadowDialog
					text={ __(
						'Are you sure you want to remove all custom shadows?'
					) }
					confirmButtonText={ __( 'Remove' ) }
					isOpen={ isResetDialogOpen }
					toggleOpen={ toggleResetDialog }
					onConfirm={ handleResetShadows }
				/>
			) }
			<ScreenHeader
				title={ __( 'Shadows' ) }
				description={ __(
					'Manage and create shadow styles for use across the site.'
				) }
			/>
			<ScreenBody>
				<VStack
					className="global-styles-ui__shadows-panel"
					spacing={ 7 }
				>
					{ defaultShadowsEnabled && (
						<ShadowList
							label={ __( 'Default' ) }
							shadows={ defaultShadows || [] }
							category="default"
						/>
					) }
					{ themeShadows && themeShadows.length > 0 && (
						<ShadowList
							label={ __( 'Theme' ) }
							shadows={ themeShadows || [] }
							category="theme"
						/>
					) }
					<ShadowList
						label={ __( 'Custom' ) }
						shadows={ customShadows || [] }
						category="custom"
						canCreate
						onCreate={ onCreateShadow }
						onReset={ toggleResetDialog }
					/>
				</VStack>
			</ScreenBody>
		</>
	);
}

interface ShadowListProps {
	label: string;
	shadows: any[];
	category: string;
	canCreate?: boolean;
	onCreate?: ( shadow: any ) => void;
	onReset?: () => void;
}

function ShadowList( {
	label,
	shadows,
	category,
	canCreate,
	onCreate,
	onReset,
}: ShadowListProps ) {
	const handleAddShadow = () => {
		const newIndex = getNewIndexFromPresets( shadows, 'shadow-' );
		onCreate?.( {
			name: sprintf(
				/* translators: %d: is an index for a preset */
				__( 'Shadow %d' ),
				newIndex
			),
			shadow: defaultShadow,
			slug: `shadow-${ newIndex }`,
		} );
	};

	return (
		<VStack spacing={ 2 }>
			<HStack justify="space-between">
				<Subtitle level={ 3 }>{ label }</Subtitle>
				<FlexItem className="global-styles-ui__shadows-panel__options-container">
					{ canCreate && (
						<Button
							size="small"
							icon={ plus }
							label={ __( 'Add shadow' ) }
							onClick={ () => {
								handleAddShadow();
							} }
						/>
					) }
					{ !! shadows?.length && category === 'custom' && (
						<Menu>
							<Menu.TriggerButton
								render={
									<Button
										size="small"
										icon={ moreVertical }
										label={ __( 'Shadow options' ) }
									/>
								}
							/>
							<Menu.Popover>
								<Menu.Item onClick={ onReset }>
									<Menu.ItemLabel>
										{ __( 'Remove all custom shadows' ) }
									</Menu.ItemLabel>
								</Menu.Item>
							</Menu.Popover>
						</Menu>
					) }
				</FlexItem>
			</HStack>
			{ shadows.length > 0 && (
				<ItemGroup isBordered isSeparated>
					{ shadows.map( ( shadow ) => (
						<ShadowItem
							key={ shadow.slug }
							shadow={ shadow }
							category={ category }
						/>
					) ) }
				</ItemGroup>
			) }
		</VStack>
	);
}

interface ShadowItemProps {
	shadow: any;
	category: string;
}

function ShadowItem( { shadow, category }: ShadowItemProps ) {
	return (
		<NavigationButtonAsItem
			path={ `/shadows/edit/${ category }/${ shadow.slug }` }
		>
			<HStack>
				<FlexItem>{ shadow.name }</FlexItem>
				<Icon icon={ isRTL() ? chevronLeft : chevronRight } />
			</HStack>
		</NavigationButtonAsItem>
	);
}

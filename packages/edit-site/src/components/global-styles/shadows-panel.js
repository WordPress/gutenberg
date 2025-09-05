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
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import {
	plus,
	Icon,
	chevronLeft,
	chevronRight,
	moreVertical,
} from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import Subtitle from './subtitle';
import { NavigationButtonAsItem } from './navigation-button';
import ScreenHeader from './header';
import { getNewIndexFromPresets } from './utils';
import { useState } from '@wordpress/element';
import ConfirmResetShadowDialog from './confirm-reset-shadow-dialog';

const { useGlobalSetting } = unlock( blockEditorPrivateApis );
const { Menu } = unlock( componentsPrivateApis );

export const defaultShadow = '6px 6px 9px rgba(0, 0, 0, 0.2)';

export default function ShadowsPanel() {
	const [ defaultShadows ] = useGlobalSetting( 'shadow.presets.default' );
	const [ defaultShadowsEnabled ] = useGlobalSetting(
		'shadow.defaultPresets'
	);
	const [ themeShadows ] = useGlobalSetting( 'shadow.presets.theme' );
	const [ customShadows, setCustomShadows ] = useGlobalSetting(
		'shadow.presets.custom'
	);

	const onCreateShadow = ( shadow ) => {
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
			<div className="edit-site-global-styles-screen">
				<VStack
					className="edit-site-global-styles__shadows-panel"
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
			</div>
		</>
	);
}

function ShadowList( {
	label,
	shadows,
	category,
	canCreate,
	onCreate,
	onReset,
} ) {
	const handleAddShadow = () => {
		const newIndex = getNewIndexFromPresets( shadows, 'shadow-' );
		onCreate( {
			name: sprintf(
				/* translators: %s: is an index for a preset */
				__( 'Shadow %s' ),
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
				<FlexItem className="edit-site-global-styles__shadows-panel__options-container">
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

function ShadowItem( { shadow, category } ) {
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

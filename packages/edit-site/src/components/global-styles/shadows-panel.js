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
import { __ } from '@wordpress/i18n';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import {
	Icon,
	plus,
	shadow as shadowIcon,
	moreVertical,
} from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import Subtitle from './subtitle';
import { NavigationButtonAsItem } from './navigation-button';
import ScreenHeader from './header';

const { useGlobalSetting } = unlock( blockEditorPrivateApis );
const {
	DropdownMenuV2: DropdownMenu,
	DropdownMenuItemV2: DropdownMenuItem,
	DropdownMenuItemLabelV2: DropdownMenuItemLabel,
} = unlock( componentsPrivateApis );

export const defaultShadow = '6px 6px #000';

export default function ShadowsPanel() {
	const [ defaultShadows, setDefaultShadows ] = useGlobalSetting(
		'shadow.presets.default'
	);
	const [ baseDefaultShadows ] = useGlobalSetting(
		'shadow.presets.default',
		undefined,
		'base'
	);
	const [ defaultShadowsEnabled ] = useGlobalSetting(
		'shadow.defaultPresets'
	);

	const [ themeShadows, setThemeShadows ] = useGlobalSetting(
		'shadow.presets.theme'
	);
	const [ baseThemeShadows ] = useGlobalSetting(
		'shadow.presets.theme',
		undefined,
		'base'
	);
	const [ customShadows, setCustomShadows ] = useGlobalSetting(
		'shadow.presets.custom'
	);

	const onCreateShadow = ( shadow ) => {
		setCustomShadows( [ ...( customShadows || [] ), shadow ] );
	};

	const onResetShadows = ( shadowCategory ) => {
		if ( shadowCategory === 'default' ) {
			setDefaultShadows( baseDefaultShadows );
		} else if ( shadowCategory === 'theme' ) {
			setThemeShadows( baseThemeShadows );
		}
	};

	return (
		<>
			<ScreenHeader
				title={ __( 'Shadows' ) }
				description={ __(
					'Manage and create shadow styles for use across the site.'
				) }
			/>
			<div className="edit-site-global-styles-screen">
				<VStack
					className="edit-site-global-styles-shadows-panel"
					spacing={ 7 }
				>
					{ defaultShadowsEnabled && (
						<ShadowList
							label={ __( 'Default' ) }
							shadows={ defaultShadows || [] }
							category="default"
							canReset={ defaultShadows !== baseDefaultShadows }
							onReset={ () => onResetShadows( 'default' ) }
						/>
					) }
					{ themeShadows && themeShadows.length > 0 && (
						<ShadowList
							label={ __( 'Theme' ) }
							shadows={ themeShadows || [] }
							category="theme"
							canReset={ themeShadows !== baseThemeShadows }
							onReset={ () => onResetShadows( 'theme' ) }
						/>
					) }
					<ShadowList
						label={ __( 'Custom' ) }
						shadows={ customShadows || [] }
						category="custom"
						canCreate
						onCreate={ onCreateShadow }
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
	canReset,
	onReset,
} ) {
	const handleAddShadow = () => {
		onCreate( {
			name: `Shadow ${ shadows.length + 1 }`,
			shadow: defaultShadow,
			slug: `shadow-${ shadows.length + 1 }`,
		} );
	};

	return (
		<VStack spacing={ 3 }>
			<HStack justify="space-between">
				<FlexItem>
					<Subtitle level={ 3 }>{ label }</Subtitle>
				</FlexItem>
				<FlexItem>
					{ canCreate ? (
						<Button
							size="small"
							icon={ plus }
							label={ __( 'Add shadow' ) }
							onClick={ () => {
								handleAddShadow();
							} }
						/>
					) : (
						<DropdownMenu
							trigger={
								<Button
									variant="tertiary"
									size="small"
									icon={ moreVertical }
									label={ __( 'Menu' ) }
								/>
							}
						>
							<DropdownMenuItem
								onClick={ onReset }
								disabled={ ! canReset }
							>
								<DropdownMenuItemLabel>
									{ __( 'Reset shadows' ) }
								</DropdownMenuItemLabel>
							</DropdownMenuItem>
						</DropdownMenu>
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
			aria-label={ 'edit' }
		>
			<HStack justify="flex-start">
				<FlexItem
					className="edit-site-global-styles-screen-typography__indicator"
					style={ {
						marginLeft: '-4px',
					} }
				>
					<Icon icon={ shadowIcon } />
				</FlexItem>
				<FlexItem>{ shadow.name }</FlexItem>
			</HStack>
		</NavigationButtonAsItem>
	);
}

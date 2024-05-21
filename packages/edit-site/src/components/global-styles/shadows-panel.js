/**
 * WordPress dependencies
 */
import {
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	__experimentalItemGroup as ItemGroup,
	Button,
	Flex,
	FlexItem,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { plus, shadow as shadowIcon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import Subtitle from './subtitle';
import { NavigationButtonAsItem } from './navigation-button';
import ScreenHeader from './header';

const { useGlobalSetting } = unlock( blockEditorPrivateApis );

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
					/>
				</VStack>
			</div>
		</>
	);
}

function ShadowList( { label, shadows, category, canCreate, onCreate } ) {
	const handleAddShadow = () => {
		onCreate( {
			name: `Shadow ${ shadows.length + 1 }`,
			shadow: defaultShadow,
			slug: `shadow-${ shadows.length + 1 }`,
		} );
	};

	return (
		<VStack spacing={ 2 }>
			<HStack justify="space-between">
				<Flex
					align="center"
					className="edit-site-global-styles__shadows-panel__title"
				>
					<Subtitle level={ 3 }>{ label }</Subtitle>
				</Flex>
				{ canCreate && (
					<FlexItem className="edit-site-global-styles__shadows-panel__options-container">
						<Button
							size="small"
							icon={ plus }
							label={ __( 'Add shadow' ) }
							onClick={ () => {
								handleAddShadow();
							} }
						/>
					</FlexItem>
				) }
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
			aria-label={
				// translators: %s: name of the shadow
				sprintf( 'Edit shadow %s', shadow.name )
			}
			icon={ shadowIcon }
		>
			{ shadow.name }
		</NavigationButtonAsItem>
	);
}

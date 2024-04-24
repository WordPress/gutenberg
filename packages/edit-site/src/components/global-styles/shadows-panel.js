/**
 * WordPress dependencies
 */
import {
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	__experimentalItemGroup as ItemGroup,
	Button,
	FlexItem,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { Icon, plus, shadow as shadowIcon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import Subtitle from './subtitle';
import { NavigationButtonAsItem } from './navigation-button';
import ScreenHeader from './header';

const { useGlobalSetting } = unlock( blockEditorPrivateApis );

export const defaultShadow = '6px 6px #000';

export default function ShadowsPanel() {
	const [ defaultShadows ] = useGlobalSetting( 'shadow.presets.default' );
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
					'Shadows and the application of those shadows on site elements.'
				) }
			/>
			<div className="edit-site-global-styles-screen">
				<VStack
					className="edit-site-global-styles-shadows-panel"
					spacing={ 7 }
				>
					<ShadowList
						label={ __( 'Default' ) }
						shadows={ defaultShadows || [] }
						category={ 'default' }
					/>
					<ShadowList
						label={ __( 'Theme' ) }
						shadows={ themeShadows || [] }
						category={ 'theme' }
						placeholder={ __( 'Theme shadows are empty!' ) }
					/>
					<ShadowList
						label={ __( 'Custom' ) }
						shadows={ customShadows || [] }
						category={ 'custom' }
						placeholder={ __( 'Custom shadows are empty!' ) }
						onCreate={ onCreateShadow }
					/>
				</VStack>
			</div>
		</>
	);
}

function ShadowList( { label, placeholder, shadows, category, onCreate } ) {
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
					{ category === 'custom' && (
						<Button
							size="small"
							icon={ plus }
							label={ __( 'Add shadow' ) }
							onClick={ () => {
								handleAddShadow();
							} }
						/>
					) }
				</FlexItem>
			</HStack>
			{ shadows.length ? (
				<ItemGroup isBordered isSeparated>
					{ shadows.map( ( shadow ) => (
						<ShadowItem
							key={ shadow.slug }
							shadow={ shadow }
							category={ category }
						/>
					) ) }
				</ItemGroup>
			) : (
				<div>{ placeholder }</div>
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

/**
 * WordPress dependencies
 */
import {
	__experimentalItemGroup as ItemGroup,
	Button,
	FlexItem,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { Stack } from '@wordpress/ui';
import { __, sprintf, isRTL } from '@wordpress/i18n';
import {
	plus,
	Icon,
	chevronLeft,
	chevronRight,
	moreVertical,
} from '@wordpress/icons';
import { useState } from '@wordpress/element';
import type { TextShadowPreset } from '@wordpress/global-styles-engine';

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

export const DEFAULT_TEXT_SHADOW = '1px 1px 2px rgba(0, 0, 0, 0.3)';

export default function ScreenTextShadows() {
	const [ defaultTextShadows ] = useSetting(
		'typography.textShadowPresets.default'
	);
	const [ defaultTextShadowsEnabled ] = useSetting(
		'typography.defaultTextShadowPresets'
	);
	const [ themeTextShadows ] = useSetting(
		'typography.textShadowPresets.theme'
	);
	const [ customTextShadows, setCustomTextShadows ] = useSetting(
		'typography.textShadowPresets.custom'
	);

	const onCreateTextShadow = ( textShadow: TextShadowPreset ) => {
		setCustomTextShadows( [ ...( customTextShadows || [] ), textShadow ] );
	};

	const handleResetTextShadows = () => {
		setCustomTextShadows( [] );
	};

	const [ isResetDialogOpen, setIsResetDialogOpen ] = useState( false );

	const toggleResetDialog = () => setIsResetDialogOpen( ! isResetDialogOpen );

	return (
		<>
			{ isResetDialogOpen && (
				<ConfirmResetShadowDialog
					text={ __(
						'Are you sure you want to remove all custom text shadows?'
					) }
					confirmButtonText={ __( 'Remove' ) }
					isOpen={ isResetDialogOpen }
					toggleOpen={ toggleResetDialog }
					onConfirm={ handleResetTextShadows }
				/>
			) }
			<ScreenHeader
				title={ __( 'Text Shadows' ) }
				description={ __(
					'Manage and create text shadow styles for use across the site.'
				) }
			/>
			<ScreenBody>
				<Stack
					className="global-styles-ui__text-shadows-panel"
					direction="column"
					gap="xl"
				>
					{ defaultTextShadowsEnabled && (
						<TextShadowList
							label={ __( 'Default' ) }
							textShadows={ defaultTextShadows || [] }
							category="default"
						/>
					) }
					{ themeTextShadows && themeTextShadows.length > 0 && (
						<TextShadowList
							label={ __( 'Theme' ) }
							textShadows={ themeTextShadows || [] }
							category="theme"
						/>
					) }
					<TextShadowList
						label={ __( 'Custom' ) }
						textShadows={ customTextShadows || [] }
						category="custom"
						canCreate
						onCreate={ onCreateTextShadow }
						onReset={ toggleResetDialog }
					/>
				</Stack>
			</ScreenBody>
		</>
	);
}

interface TextShadowListProps {
	label: string;
	textShadows: TextShadowPreset[];
	category: string;
	canCreate?: boolean;
	onCreate?: ( textShadow: TextShadowPreset ) => void;
	onReset?: () => void;
}

function TextShadowList( {
	label,
	textShadows,
	category,
	canCreate,
	onCreate,
	onReset,
}: TextShadowListProps ) {
	const handleAddTextShadow = () => {
		const newIndex = getNewIndexFromPresets( textShadows, 'text-shadow-' );
		onCreate?.( {
			name: sprintf(
				/* translators: %d: is an index for a preset */
				__( 'Text Shadow %d' ),
				newIndex
			),
			textShadow: DEFAULT_TEXT_SHADOW,
			slug: `text-shadow-${ newIndex }`,
		} );
	};

	return (
		<Stack direction="column" gap="sm">
			<Stack direction="row" justify="space-between" align="center">
				<Subtitle level={ 3 }>{ label }</Subtitle>
				<FlexItem className="global-styles-ui__text-shadows-panel__options-container">
					{ canCreate && (
						<Button
							size="small"
							icon={ plus }
							label={ __( 'Add text shadow' ) }
							onClick={ handleAddTextShadow }
						/>
					) }
					{ !! textShadows?.length && category === 'custom' && (
						<Menu>
							<Menu.TriggerButton
								render={
									<Button
										size="small"
										icon={ moreVertical }
										label={ __( 'Text shadow options' ) }
									/>
								}
							/>
							<Menu.Popover>
								<Menu.Item onClick={ onReset }>
									<Menu.ItemLabel>
										{ __(
											'Remove all custom text shadows'
										) }
									</Menu.ItemLabel>
								</Menu.Item>
							</Menu.Popover>
						</Menu>
					) }
				</FlexItem>
			</Stack>
			{ textShadows.length > 0 && (
				<ItemGroup isBordered isSeparated>
					{ textShadows.map( ( textShadow ) => (
						<NavigationButtonAsItem
							key={ textShadow.slug }
							path={ `/typography/text-shadows/edit/${ category }/${ textShadow.slug }` }
						>
							<Stack
								direction="row"
								justify="space-between"
								align="center"
							>
								<FlexItem>{ textShadow.name }</FlexItem>
								<Icon
									icon={
										isRTL() ? chevronLeft : chevronRight
									}
								/>
							</Stack>
						</NavigationButtonAsItem>
					) ) }
				</ItemGroup>
			) }
		</Stack>
	);
}

/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	__experimentalSpacer as Spacer,
	__experimentalItemGroup as ItemGroup,
	__experimentalHeading as Heading,
	__experimentalUnitControl as UnitControl,
	__experimentalGrid as Grid,
	__experimentalDropdownContentWrapper as DropdownContentWrapper,
	__experimentalUseNavigator as useNavigator,
	Dropdown,
	RangeControl,
	Button,
	FlexItem,
	ColorPicker,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import {
	Icon,
	plus,
	shadow as shadowIcon,
	lineSolid,
	settings,
} from '@wordpress/icons';
import { useState, useMemo } from '@wordpress/element';
import { debounce } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import Subtitle from './subtitle';
import ScreenHeader from './header';
import { defaultShadow } from './shadows-panel';
import {
	getShadowParts,
	shadowStringToObject,
	shadowObjectToString,
} from './utils';

const { useGlobalSetting } = unlock( blockEditorPrivateApis );

export default function ShadowsEditPanel() {
	const {
		params: { category, slug },
	} = useNavigator();
	const [ shadows, setShadows ] = useGlobalSetting(
		`shadow.presets.${ category }`
	);
	const selectedShadow = useMemo(
		() => ( shadows || [] ).find( ( shadow ) => shadow.slug === slug ),
		[ shadows, slug ]
	);
	const onShadowChange = debounce( ( shadow ) => {
		const updatedShadow = { ...( selectedShadow || {} ), shadow };
		setShadows(
			shadows.map( ( s ) => ( s.slug === slug ? updatedShadow : s ) )
		);
	}, 100 );

	return (
		<>
			<ScreenHeader title={ selectedShadow.name } />
			<div className="edit-site-global-styles-screen">
				<ShadowsPreview shadow={ selectedShadow.shadow } />
				<ShadowEditor
					shadow={ selectedShadow.shadow }
					onChange={ onShadowChange }
				/>
			</div>
		</>
	);
}

function ShadowsPreview( { shadow } ) {
	const shadowStyle = {
		boxShadow: shadow,
	};

	return (
		<Spacer marginBottom={ 4 } marginTop={ -2 }>
			<HStack
				align="center"
				justify="center"
				className="edit-site-global-styles__shadow-preview-panel"
			>
				<div
					className="edit-site-global-styles__shadow-preview-block"
					style={ shadowStyle }
				/>
			</HStack>
		</Spacer>
	);
}

function ShadowEditor( { shadow, onChange } ) {
	const shadowParts = getShadowParts( shadow );

	const onChangeShadowPart = ( index, part ) => {
		shadowParts[ index ] = part;
		onChange( shadowParts.join( ', ' ) );
	};

	const onAddShadowPart = () => {
		shadowParts.push( defaultShadow );
		onChange( shadowParts.join( ', ' ) );
	};

	const onRemoveShadowPart = ( index ) => {
		shadowParts.splice( index, 1 );
		onChange( shadowParts.join( ', ' ) );
	};

	return (
		<>
			<VStack spacing={ 8 }>
				<HStack justify="space-between">
					<FlexItem>
						<Subtitle level={ 3 }>{ 'Shadows' }</Subtitle>
					</FlexItem>
					<FlexItem>
						<Button
							size="small"
							icon={ plus }
							label={ __( 'Add shadow' ) }
							onClick={ () => {
								onAddShadowPart();
							} }
						/>
					</FlexItem>
				</HStack>
			</VStack>
			<Spacer />
			<ItemGroup isBordered isSeparated>
				{ shadowParts.map( ( part, index ) => (
					<ShadowItem
						key={ index }
						shadow={ part }
						onChange={ ( value ) =>
							onChangeShadowPart( index, value )
						}
						canRemove={ shadowParts.length > 1 }
						onRemove={ () => onRemoveShadowPart( index ) }
					/>
				) ) }
			</ItemGroup>
		</>
	);
}

function ShadowItem( { shadow, onChange, canRemove, onRemove } ) {
	const popoverProps = {
		placement: 'left-start',
		offset: 36,
		shift: true,
	};

	return (
		<Dropdown
			popoverProps={ popoverProps }
			className="block-editor-tools-panel-color-gradient-settings__dropdown"
			renderToggle={ ( { onToggle, isOpen } ) => {
				const toggleProps = {
					onClick: onToggle,
					className: classnames(
						'block-editor-panel-color-gradient-settings__dropdown',
						{ 'is-open': isOpen }
					),
				};

				return (
					<Button { ...toggleProps }>
						<HStack align="center" justify="flex-start">
							<FlexItem
								display="flex"
								style={ {
									marginLeft: '-4px',
								} }
							>
								<Icon icon={ shadowIcon } />
							</FlexItem>
							<FlexItem style={ { flexGrow: 1 } }>
								Drop shadow
							</FlexItem>
							{ canRemove && (
								<FlexItem
									display="flex"
									style={ {
										marginRight: '-4px',
									} }
									onClick={ ( e ) => {
										e.stopPropagation();
										onRemove();
									} }
								>
									<Icon icon={ lineSolid } />
								</FlexItem>
							) }
						</HStack>
					</Button>
				);
			} }
			renderContent={ () => (
				<DropdownContentWrapper paddingSize="none">
					<div className="block-editor-panel-color-gradient-settings__dropdown-content">
						<ShadowPopover
							shadow={ shadow }
							onChange={ onChange }
						/>
					</div>
				</DropdownContentWrapper>
			) }
		/>
	);
}

function ShadowPopover( { shadow: savedShadow, onChange } ) {
	const shadowObj = shadowStringToObject( savedShadow );
	const [ shadow, setShadow ] = useState( {
		x: shadowObj.x,
		y: shadowObj.y,
		blur: shadowObj.blur,
		spread: shadowObj.spread,
		color: shadowObj.color,
		inset: shadowObj.inset,
	} );

	const onShadowChange = ( key, value ) => {
		onChange( shadowObjectToString( shadow ) );
		setShadow( {
			...shadow,
			[ key ]: value,
		} );
	};

	return (
		<div style={ { width: '260px', padding: '16px' } }>
			<VStack>
				<Heading level={ 5 }>{ __( 'Drop shadow' ) }</Heading>
				<Spacer marginBottom={ 4 } />
				<ShadowColorPicker
					color={ shadow.color }
					onChange={ ( value ) => onShadowChange( 'color', value ) }
				/>
				<Spacer marginBottom={ 4 } />
				<Grid id={ 'grid-123' } columns={ 2 } gap={ 6 } rowGap={ 2 }>
					<ShadowInputControl
						label="X position"
						value={ shadow.x }
						onChange={ ( value ) => onShadowChange( 'x', value ) }
					/>
					<ShadowInputControl
						label="Y position"
						value={ shadow.y }
						onChange={ ( value ) => onShadowChange( 'y', value ) }
					/>
					<ShadowInputControl
						label="Blur"
						value={ shadow.blur }
						onChange={ ( value ) =>
							onShadowChange( 'blur', value )
						}
					/>
					<ShadowInputControl
						label="Spread"
						value={ shadow.spread }
						onChange={ ( value ) =>
							onShadowChange( 'spread', value )
						}
					/>
				</Grid>
			</VStack>
		</div>
	);
}

function ShadowColorPicker( { color, onChange } ) {
	const popoverProps = {
		placement: 'left-start',
		offset: 36,
		shift: true,
	};

	return (
		<Dropdown
			popoverProps={ popoverProps }
			className="block-editor-tools-panel-color-gradient-settings__dropdown"
			renderToggle={ ( { onToggle, isOpen } ) => {
				const toggleProps = {
					onClick: onToggle,
					className: classnames(
						'block-editor-panel-color-gradient-settings__dropdown',
						{ 'is-open': isOpen }
					),
				};

				return (
					<Button
						{ ...toggleProps }
						style={ { background: color, height: '64px' } }
					/>
				);
			} }
			renderContent={ () => (
				<DropdownContentWrapper paddingSize="none">
					<div className="block-editor-panel-color-gradient-settings__dropdown-content">
						<ColorPicker
							color={ color }
							onChange={ onChange }
							enableAlpha
							defaultColor={ '#000' }
						/>
					</div>
				</DropdownContentWrapper>
			) }
		/>
	);
}

function ShadowInputControl( { label, value, onChange } ) {
	const [ useInput, setUseInput ] = useState( false );

	return (
		<VStack justify={ 'flex-start' }>
			<HStack justify="space-between">
				<Subtitle>{ label }</Subtitle>
				<Button
					label={ __( 'Label' ) }
					icon={ settings }
					onClick={ () => {
						setUseInput( ! useInput );
					} }
					isPressed={ useInput }
					size="small"
				/>
			</HStack>
			{ useInput ? (
				<UnitControl
					label={ label }
					hideLabelFromVision
					value={ value }
					onChange={ onChange }
				/>
			) : (
				<RangeControl
					value={ value }
					onChange={ onChange }
					withInputField={ false }
					min={ 0 }
					max={ 10 }
				/>
			) }
		</VStack>
	);
}

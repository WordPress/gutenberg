/**
 * External dependencies
 */
import kebabCase from 'lodash';

/**
 * WordPress dependencies
 */
import { useState, useRef, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { lineSolid, moreVertical, plus } from '@wordpress/icons';
import { __experimentalUseFocusOutside as useFocusOutside } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import Button from '../button';
import { ColorPicker } from '../color-picker';
import { FlexItem } from '../flex';
import { HStack } from '../h-stack';
import { ItemGroup } from '../item-group';
import { VStack } from '../v-stack';
import ColorPalette from '../color-palette';
import DropdownMenu from '../dropdown-menu';
import Popover from '../popover';
import {
	ColorActionsContainer,
	ColorEditStyles,
	ColorHeading,
	ColorHStackHeader,
	ColorIndicatorStyled,
	ColorItem,
	ColorNameContainer,
	ColorNameInputControl,
	DoneButton,
	RemoveButton,
} from './styles';
import { NavigableMenu } from '../navigable-container';

function ColorNameInput( { value, onChange } ) {
	return (
		<ColorNameInputControl
			label={ __( 'Color name' ) }
			hideLabelFromVision
			value={ value }
			onChange={ onChange }
		/>
	);
}

function ColorOption( {
	color,
	onChange,
	isEditing,
	onStartEditing,
	onRemove,
	onStopEditing,
} ) {
	const focusOutsideProps = useFocusOutside( onStopEditing );
	return (
		<ColorItem
			as="div"
			onClick={ onStartEditing }
			{ ...( isEditing ? focusOutsideProps : {} ) }
		>
			<HStack justify="flex-start">
				<FlexItem>
					<ColorIndicatorStyled colorValue={ color.color } />
				</FlexItem>
				<FlexItem>
					{ isEditing ? (
						<ColorNameInput
							value={ color.name }
							onChange={ ( nextName ) =>
								onChange( {
									...color,
									name: nextName,
									slug: kebabCase( nextName ),
								} )
							}
						/>
					) : (
						<ColorNameContainer>{ color.name }</ColorNameContainer>
					) }
				</FlexItem>
				{ isEditing && (
					<FlexItem>
						<RemoveButton
							isSmall
							icon={ lineSolid }
							label={ __( 'Remove color' ) }
							onClick={ onRemove }
						/>
					</FlexItem>
				) }
			</HStack>
			{ isEditing && (
				<Popover
					position="bottom left"
					className="components-color-edit__color-popover"
				>
					<ColorPicker
						color={ color.color }
						onChange={ ( newColor ) =>
							onChange( {
								...color,
								color: newColor,
							} )
						}
					/>
				</Popover>
			) }
		</ColorItem>
	);
}

function ColorPaletteEditListView( {
	colors,
	onChange,
	editingColor,
	setEditingColor,
} ) {
	// When unmounting the component if there are empty colors (the user did not complete the insertion) clean them.
	const colorReference = useRef();
	useEffect( () => {
		colorReference.current = colors;
	}, [ colors ] );
	useEffect( () => {
		return () => {
			if ( colorReference.current.some( ( { slug } ) => ! slug ) ) {
				const newColors = colorReference.current.filter(
					( { slug } ) => slug
				);
				onChange( newColors.length ? newColors : undefined );
			}
		};
	}, [] );
	return (
		<VStack spacing={ 3 }>
			<ItemGroup isBordered isSeparated>
				{ colors.map( ( color, index ) => (
					<ColorOption
						key={ index }
						color={ color }
						onStartEditing={ () => {
							if ( editingColor !== index ) {
								setEditingColor( index );
							}
						} }
						onChange={ ( newColor ) => {
							onChange(
								colors.map( ( currentColor, currentIndex ) => {
									if ( currentIndex === index ) {
										return newColor;
									}
									return currentColor;
								} )
							);
						} }
						onRemove={ () => {
							setEditingColor( null );
							const newColors = colors.filter(
								( _currentColor, currentIndex ) => {
									if ( currentIndex === index ) {
										return false;
									}
									return true;
								}
							);
							onChange(
								newColors.length ? newColors : undefined
							);
						} }
						isEditing={ index === editingColor }
						onStopEditing={ () => {
							if ( index === editingColor ) {
								setEditingColor( null );
							}
						} }
					/>
				) ) }
			</ItemGroup>
		</VStack>
	);
}

const EMPTY_ARRAY = [];

export default function ColorEdit( { colors = EMPTY_ARRAY, onChange } ) {
	const [ isEditing, setIsEditing ] = useState( false );
	const [ editingColor, setEditingColor ] = useState( null );
	const isAdding =
		isEditing &&
		editingColor &&
		colors[ editingColor ] &&
		! colors[ editingColor ].slug;

	const hasColors = colors.length > 0;

	return (
		<ColorEditStyles>
			<ColorHStackHeader>
				<ColorHeading>{ __( 'Custom' ) }</ColorHeading>
				<ColorActionsContainer>
					{ isEditing && (
						<DoneButton
							isSmall
							onClick={ () => {
								setIsEditing( false );
								setEditingColor( null );
							} }
						>
							{ __( 'Done' ) }
						</DoneButton>
					) }
					<Button
						isSmall
						isPressed={ isAdding }
						icon={ plus }
						label={ __( 'Add custom color' ) }
						onClick={ () => {
							onChange( [
								...colors,
								{
									color: '#000',
									name: '',
									slug: '',
								},
							] );
							setIsEditing( true );
							setEditingColor( colors.length );
						} }
					/>
					{ ! isEditing && (
						<Button
							disabled={ ! hasColors }
							isSmall
							icon={ moreVertical }
							label={ __( 'Edit colors' ) }
							onClick={ () => {
								setIsEditing( true );
							} }
						/>
					) }
					{ isEditing && (
						<DropdownMenu
							icon={ moreVertical }
							label={ __( 'Custom color options' ) }
							toggleProps={ {
								isSmall: true,
							} }
						>
							{ ( { onClose } ) => (
								<>
									<NavigableMenu role="menu">
										<Button
											variant="tertiary"
											onClick={ () => {
												setEditingColor( null );
												setIsEditing( false );
												onChange();
												onClose();
											} }
										>
											{ __( 'Remove all custom colors' ) }
										</Button>
									</NavigableMenu>
								</>
							) }
						</DropdownMenu>
					) }
				</ColorActionsContainer>
			</ColorHStackHeader>
			{ hasColors && (
				<>
					{ isEditing && (
						<ColorPaletteEditListView
							colors={ colors }
							onChange={ onChange }
							editingColor={ editingColor }
							setEditingColor={ setEditingColor }
						/>
					) }
					{ ! isEditing && (
						<ColorPalette
							colors={ colors }
							onChange={ () => {} }
							clearable={ false }
							disableCustomColors={ true }
						/>
					) }
				</>
			) }
			{ ! hasColors &&
				__(
					'Custom colors are empty! Add some colors to create your own color palette.'
				) }
		</ColorEditStyles>
	);
}

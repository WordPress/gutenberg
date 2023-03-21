/**
 * External dependencies
 */
import { kebabCase } from 'lodash';

/**
 * WordPress dependencies
 */
import { useState, useRef, useEffect, useCallback } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { lineSolid, moreVertical, plus } from '@wordpress/icons';
import {
	__experimentalUseFocusOutside as useFocusOutside,
	useDebounce,
} from '@wordpress/compose';

/**
 * Internal dependencies
 */
import Button from '../button';
import { ColorPicker } from '../color-picker';
import { FlexItem } from '../flex';
import { HStack } from '../h-stack';
import { ItemGroup } from '../item-group';
import { VStack } from '../v-stack';
import GradientPicker from '../gradient-picker';
import ColorPalette from '../color-palette';
import DropdownMenu from '../dropdown-menu';
import Popover from '../popover';
import {
	PaletteActionsContainer,
	PaletteEditStyles,
	PaletteHeading,
	PaletteHStackHeader,
	IndicatorStyled,
	PaletteItem,
	NameContainer,
	NameInputControl,
	DoneButton,
	RemoveButton,
} from './styles';
import { NavigableMenu } from '../navigable-container';
import { DEFAULT_GRADIENT } from '../custom-gradient-picker/constants';
import CustomGradientPicker from '../custom-gradient-picker';

const DEFAULT_COLOR = '#000';

function NameInput( { value, onChange, label } ) {
	return (
		<NameInputControl
			label={ label }
			hideLabelFromVision
			value={ value }
			onChange={ onChange }
		/>
	);
}

/**
 * Returns a temporary name for a palette item in the format "Color + id".
 * To ensure there are no duplicate ids, this function checks all slugs for temporary names.
 * It expects slugs to be in the format: slugPrefix + color- + number.
 * It then sets the id component of the new name based on the incremented id of the highest existing slug id.
 *
 * @param {string} elements   An array of color palette items.
 * @param {string} slugPrefix The slug prefix used to match the element slug.
 *
 * @return {string} A unique name for a palette item.
 */
export function getNameForPosition( elements, slugPrefix ) {
	const temporaryNameRegex = new RegExp( `^${ slugPrefix }color-([\\d]+)$` );
	const position = elements.reduce( ( previousValue, currentValue ) => {
		if ( typeof currentValue?.slug === 'string' ) {
			const matches = currentValue?.slug.match( temporaryNameRegex );
			if ( matches ) {
				const id = parseInt( matches[ 1 ], 10 );
				if ( id >= previousValue ) {
					return id + 1;
				}
			}
		}
		return previousValue;
	}, 1 );

	return sprintf(
		/* translators: %s: is a temporary id for a custom color */
		__( 'Color %s' ),
		position
	);
}

function ColorPickerPopover( {
	isGradient,
	element,
	onChange,
	onClose = () => {},
} ) {
	return (
		<Popover
			placement="left-start"
			offset={ 20 }
			className="components-palette-edit__popover"
			onClose={ onClose }
		>
			{ ! isGradient && (
				<ColorPicker
					color={ element.color }
					enableAlpha
					onChange={ ( newColor ) =>
						onChange( {
							...element,
							color: newColor,
						} )
					}
				/>
			) }
			{ isGradient && (
				<div className="components-palette-edit__popover-gradient-picker">
					<CustomGradientPicker
						__nextHasNoMargin
						__experimentalIsRenderedInSidebar
						value={ element.gradient }
						onChange={ ( newGradient ) =>
							onChange( {
								...element,
								gradient: newGradient,
							} )
						}
					/>
				</div>
			) }
		</Popover>
	);
}

function Option( {
	canOnlyChangeValues,
	element,
	onChange,
	isEditing,
	onStartEditing,
	onRemove,
	onStopEditing,
	slugPrefix,
	isGradient,
} ) {
	const focusOutsideProps = useFocusOutside( onStopEditing );
	const value = isGradient ? element.gradient : element.color;

	return (
		<PaletteItem
			className={ isEditing ? 'is-selected' : undefined }
			as="div"
			onClick={ onStartEditing }
			{ ...( isEditing
				? { ...focusOutsideProps }
				: {
						style: {
							cursor: 'pointer',
						},
				  } ) }
		>
			<HStack justify="flex-start">
				<FlexItem>
					<IndicatorStyled
						style={ { background: value, color: 'transparent' } }
					/>
				</FlexItem>
				<FlexItem>
					{ isEditing && ! canOnlyChangeValues ? (
						<NameInput
							label={
								isGradient
									? __( 'Gradient name' )
									: __( 'Color name' )
							}
							value={ element.name }
							onChange={ ( nextName ) =>
								onChange( {
									...element,
									name: nextName,
									slug: slugPrefix + kebabCase( nextName ),
								} )
							}
						/>
					) : (
						<NameContainer>{ element.name }</NameContainer>
					) }
				</FlexItem>
				{ isEditing && ! canOnlyChangeValues && (
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
				<ColorPickerPopover
					isGradient={ isGradient }
					onChange={ onChange }
					element={ element }
				/>
			) }
		</PaletteItem>
	);
}

function isTemporaryElement( slugPrefix, { slug, color, gradient } ) {
	const regex = new RegExp( `^${ slugPrefix }color-([\\d]+)$` );
	return (
		regex.test( slug ) &&
		( ( !! color && color === DEFAULT_COLOR ) ||
			( !! gradient && gradient === DEFAULT_GRADIENT ) )
	);
}

function PaletteEditListView( {
	elements,
	onChange,
	editingElement,
	setEditingElement,
	canOnlyChangeValues,
	slugPrefix,
	isGradient,
} ) {
	// When unmounting the component if there are empty elements (the user did not complete the insertion) clean them.
	const elementsReference = useRef();
	useEffect( () => {
		elementsReference.current = elements;
	}, [ elements ] );
	useEffect( () => {
		return () => {
			if (
				elementsReference.current.some( ( element, index ) =>
					isTemporaryElement( slugPrefix, element, index )
				)
			) {
				const newElements = elementsReference.current.filter(
					( element ) => ! isTemporaryElement( slugPrefix, element )
				);
				onChange( newElements.length ? newElements : undefined );
			}
		};
		// Disable reason: adding the missing dependency here would cause breaking changes that will require
		// a heavier refactor to avoid. See https://github.com/WordPress/gutenberg/pull/43911
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );

	const debounceOnChange = useDebounce( onChange, 100 );

	return (
		<VStack spacing={ 3 }>
			<ItemGroup isRounded>
				{ elements.map( ( element, index ) => (
					<Option
						isGradient={ isGradient }
						canOnlyChangeValues={ canOnlyChangeValues }
						key={ index }
						element={ element }
						onStartEditing={ () => {
							if ( editingElement !== index ) {
								setEditingElement( index );
							}
						} }
						onChange={ ( newElement ) => {
							debounceOnChange(
								elements.map(
									( currentElement, currentIndex ) => {
										if ( currentIndex === index ) {
											return newElement;
										}
										return currentElement;
									}
								)
							);
						} }
						onRemove={ () => {
							setEditingElement( null );
							const newElements = elements.filter(
								( _currentElement, currentIndex ) => {
									if ( currentIndex === index ) {
										return false;
									}
									return true;
								}
							);
							onChange(
								newElements.length ? newElements : undefined
							);
						} }
						isEditing={ index === editingElement }
						onStopEditing={ () => {
							if ( index === editingElement ) {
								setEditingElement( null );
							}
						} }
						slugPrefix={ slugPrefix }
					/>
				) ) }
			</ItemGroup>
		</VStack>
	);
}

const EMPTY_ARRAY = [];

export default function PaletteEdit( {
	gradients,
	colors = EMPTY_ARRAY,
	onChange,
	paletteLabel,
	emptyMessage,
	canOnlyChangeValues,
	canReset,
	slugPrefix = '',
} ) {
	const isGradient = !! gradients;
	const elements = isGradient ? gradients : colors;
	const [ isEditing, setIsEditing ] = useState( false );
	const [ editingElement, setEditingElement ] = useState( null );
	const isAdding =
		isEditing &&
		editingElement &&
		elements[ editingElement ] &&
		! elements[ editingElement ].slug;
	const elementsLength = elements.length;
	const hasElements = elementsLength > 0;
	const debounceOnChange = useDebounce( onChange, 100 );
	const onSelectPaletteItem = useCallback(
		( value, newEditingElementIndex ) => {
			const selectedElement = elements[ newEditingElementIndex ];
			const key = isGradient ? 'gradient' : 'color';
			// Ensures that the index returned matches a known element value.
			if ( !! selectedElement && selectedElement[ key ] === value ) {
				setEditingElement( newEditingElementIndex );
			} else {
				setIsEditing( true );
			}
		},
		[ isGradient, elements ]
	);

	return (
		<PaletteEditStyles>
			<PaletteHStackHeader>
				<PaletteHeading>{ paletteLabel }</PaletteHeading>
				<PaletteActionsContainer>
					{ hasElements && isEditing && (
						<DoneButton
							isSmall
							onClick={ () => {
								setIsEditing( false );
								setEditingElement( null );
							} }
						>
							{ __( 'Done' ) }
						</DoneButton>
					) }
					{ ! canOnlyChangeValues && (
						<Button
							isSmall
							isPressed={ isAdding }
							icon={ plus }
							label={
								isGradient
									? __( 'Add gradient' )
									: __( 'Add color' )
							}
							onClick={ () => {
								const tempOptionName = getNameForPosition(
									elements,
									slugPrefix
								);

								onChange( [
									...elements,
									{
										...( isGradient
											? { gradient: DEFAULT_GRADIENT }
											: { color: DEFAULT_COLOR } ),
										name: tempOptionName,
										slug:
											slugPrefix +
											kebabCase( tempOptionName ),
									},
								] );
								setIsEditing( true );
								setEditingElement( elements.length );
							} }
						/>
					) }

					{ hasElements &&
						( ! isEditing ||
							! canOnlyChangeValues ||
							canReset ) && (
							<DropdownMenu
								icon={ moreVertical }
								label={
									isGradient
										? __( 'Gradient options' )
										: __( 'Color options' )
								}
								toggleProps={ {
									isSmall: true,
								} }
							>
								{ ( { onClose } ) => (
									<>
										<NavigableMenu role="menu">
											{ ! isEditing && (
												<Button
													variant="tertiary"
													onClick={ () => {
														setIsEditing( true );
														onClose();
													} }
													className="components-palette-edit__menu-button"
												>
													{ __( 'Show details' ) }
												</Button>
											) }
											{ ! canOnlyChangeValues && (
												<Button
													variant="tertiary"
													onClick={ () => {
														setEditingElement(
															null
														);
														setIsEditing( false );
														onChange();
														onClose();
													} }
													className="components-palette-edit__menu-button"
												>
													{ isGradient
														? __(
																'Remove all gradients'
														  )
														: __(
																'Remove all colors'
														  ) }
												</Button>
											) }
											{ canReset && (
												<Button
													variant="tertiary"
													onClick={ () => {
														setEditingElement(
															null
														);
														onChange();
														onClose();
													} }
												>
													{ isGradient
														? __( 'Reset gradient' )
														: __( 'Reset colors' ) }
												</Button>
											) }
										</NavigableMenu>
									</>
								) }
							</DropdownMenu>
						) }
				</PaletteActionsContainer>
			</PaletteHStackHeader>
			{ hasElements && (
				<>
					{ isEditing && (
						<PaletteEditListView
							canOnlyChangeValues={ canOnlyChangeValues }
							elements={ elements }
							onChange={ onChange }
							editingElement={ editingElement }
							setEditingElement={ setEditingElement }
							slugPrefix={ slugPrefix }
							isGradient={ isGradient }
						/>
					) }
					{ ! isEditing && editingElement !== null && (
						<ColorPickerPopover
							isGradient={ isGradient }
							onClose={ () => setEditingElement( null ) }
							onChange={ ( newElement ) => {
								debounceOnChange(
									elements.map(
										( currentElement, currentIndex ) => {
											if (
												currentIndex === editingElement
											) {
												return newElement;
											}
											return currentElement;
										}
									)
								);
							} }
							element={ elements[ editingElement ] }
						/>
					) }
					{ ! isEditing &&
						( isGradient ? (
							<GradientPicker
								__nextHasNoMargin
								gradients={ gradients }
								onChange={ onSelectPaletteItem }
								clearable={ false }
								disableCustomGradients={ true }
							/>
						) : (
							<ColorPalette
								colors={ colors }
								onChange={ onSelectPaletteItem }
								clearable={ false }
								disableCustomColors={ true }
							/>
						) ) }
				</>
			) }
			{ ! hasElements && emptyMessage }
		</PaletteEditStyles>
	);
}

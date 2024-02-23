/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	useState,
	useRef,
	useEffect,
	useCallback,
	useMemo,
} from '@wordpress/element';
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
import { kebabCase } from '../utils/strings';
import type {
	Color,
	ColorPickerPopoverProps,
	Gradient,
	NameInputProps,
	OptionProps,
	PaletteEditListViewProps,
	PaletteEditProps,
	PaletteElement,
} from './types';

const DEFAULT_COLOR = '#000';

function NameInput( { value, onChange, label }: NameInputProps ) {
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
 * Returns a name for a palette item in the format "Color + id".
 * To ensure there are no duplicate ids, this function checks all slugs.
 * It expects slugs to be in the format: slugPrefix + color- + number.
 * It then sets the id component of the new name based on the incremented id of the highest existing slug id.
 *
 * @param elements   An array of color palette items.
 * @param slugPrefix The slug prefix used to match the element slug.
 *
 * @return A unique name for a palette item.
 */
export function getNameForPosition(
	elements: PaletteElement[],
	slugPrefix: string
) {
	const nameRegex = new RegExp( `^${ slugPrefix }color-([\\d]+)$` );
	const position = elements.reduce( ( previousValue, currentValue ) => {
		if ( typeof currentValue?.slug === 'string' ) {
			const matches = currentValue?.slug.match( nameRegex );
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
		/* translators: %s: is an id for a custom color */
		__( 'Color %s' ),
		position
	);
}

function ColorPickerPopover< T extends Color | Gradient >( {
	isGradient,
	element,
	onChange,
	popoverProps: receivedPopoverProps,
	onClose = () => {},
}: ColorPickerPopoverProps< T > ) {
	const popoverProps: ColorPickerPopoverProps< T >[ 'popoverProps' ] =
		useMemo(
			() => ( {
				shift: true,
				offset: 20,
				// Disabling resize as it would otherwise cause the popover to show
				// scrollbars while dragging the color picker's handle close to the
				// popover edge.
				resize: false,
				placement: 'left-start',
				...receivedPopoverProps,
				className: classnames(
					'components-palette-edit__popover',
					receivedPopoverProps?.className
				),
			} ),
			[ receivedPopoverProps ]
		);

	return (
		<Popover { ...popoverProps } onClose={ onClose }>
			{ ! isGradient && (
				<ColorPicker
					color={ element.color }
					enableAlpha
					onChange={ ( newColor ) => {
						onChange( {
							...element,
							color: newColor,
						} );
					} }
				/>
			) }
			{ isGradient && (
				<div className="components-palette-edit__popover-gradient-picker">
					<CustomGradientPicker
						__experimentalIsRenderedInSidebar
						value={ element.gradient }
						onChange={ ( newGradient ) => {
							onChange( {
								...element,
								gradient: newGradient,
							} );
						} }
					/>
				</div>
			) }
		</Popover>
	);
}

function Option< T extends Color | Gradient >( {
	canOnlyChangeValues,
	element,
	onChange,
	isEditing,
	onStartEditing,
	onRemove,
	onStopEditing,
	popoverProps: receivedPopoverProps,
	slugPrefix,
	isGradient,
}: OptionProps< T > ) {
	const focusOutsideProps = useFocusOutside( onStopEditing );
	const value = isGradient ? element.gradient : element.color;

	// Use internal state instead of a ref to make sure that the component
	// re-renders when the popover's anchor updates.
	const [ popoverAnchor, setPopoverAnchor ] = useState( null );
	const popoverProps = useMemo(
		() => ( {
			...receivedPopoverProps,
			// Use the custom palette color item as the popover anchor.
			anchor: popoverAnchor,
		} ),
		[ popoverAnchor, receivedPopoverProps ]
	);

	return (
		<PaletteItem
			className={ isEditing ? 'is-selected' : undefined }
			as={ isEditing ? 'div' : 'button' }
			onClick={ onStartEditing }
			aria-label={
				isEditing
					? undefined
					: sprintf(
							// translators: %s is a color or gradient name, e.g. "Red".
							__( 'Edit: %s' ),
							element.name.trim().length ? element.name : value
					  )
			}
			ref={ setPopoverAnchor }
			{ ...( isEditing ? { ...focusOutsideProps } : {} ) }
		>
			<HStack justify="flex-start">
				<IndicatorStyled colorValue={ value } />
				<FlexItem>
					{ isEditing && ! canOnlyChangeValues ? (
						<NameInput
							label={
								isGradient
									? __( 'Gradient name' )
									: __( 'Color name' )
							}
							value={ element.name }
							onChange={ ( nextName?: string ) =>
								onChange( {
									...element,
									name: nextName,
									slug:
										slugPrefix +
										kebabCase( nextName ?? '' ),
								} )
							}
						/>
					) : (
						<NameContainer>
							{ element.name.trim().length
								? element.name
								: /* Fall back to non-breaking space to maintain height */
								  '\u00A0' }
						</NameContainer>
					) }
				</FlexItem>
				{ isEditing && ! canOnlyChangeValues && (
					<FlexItem>
						<RemoveButton
							size="small"
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
					popoverProps={ popoverProps }
				/>
			) }
		</PaletteItem>
	);
}

function PaletteEditListView< T extends Color | Gradient >( {
	elements,
	onChange,
	editingElement,
	setEditingElement,
	canOnlyChangeValues,
	slugPrefix,
	isGradient,
	popoverProps,
}: PaletteEditListViewProps< T > ) {
	// When unmounting the component if there are empty elements (the user did not complete the insertion) clean them.
	const elementsReference = useRef< typeof elements >();
	useEffect( () => {
		elementsReference.current = elements;
	}, [ elements ] );

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
						popoverProps={ popoverProps }
					/>
				) ) }
			</ItemGroup>
		</VStack>
	);
}

const EMPTY_ARRAY: Color[] = [];

/**
 * Allows editing a palette of colors or gradients.
 *
 * ```jsx
 * import { PaletteEdit } from '@wordpress/components';
 * const MyPaletteEdit = () => {
 *   const [ controlledColors, setControlledColors ] = useState( colors );
 *
 *   return (
 *     <PaletteEdit
 *       colors={ controlledColors }
 *       onChange={ ( newColors?: Color[] ) => {
 *         setControlledColors( newColors );
 *       } }
 *       paletteLabel="Here is a label"
 *     />
 *   );
 * };
 * ```
 */
export function PaletteEdit( {
	gradients,
	colors = EMPTY_ARRAY,
	onChange,
	paletteLabel,
	paletteLabelHeadingLevel = 2,
	emptyMessage,
	canOnlyChangeValues,
	canReset,
	slugPrefix = '',
	popoverProps,
}: PaletteEditProps ) {
	const isGradient = !! gradients;
	const elements = isGradient ? gradients : colors;
	const [ isEditing, setIsEditing ] = useState( false );
	const [ editingElement, setEditingElement ] = useState<
		number | null | undefined
	>( null );
	const isAdding =
		isEditing &&
		!! editingElement &&
		elements[ editingElement ] &&
		! elements[ editingElement ].slug;
	const elementsLength = elements.length;
	const hasElements = elementsLength > 0;
	const debounceOnChange = useDebounce( onChange, 100 );
	const onSelectPaletteItem = useCallback(
		(
			value?: PaletteElement[ keyof PaletteElement ],
			newEditingElementIndex?: number
		) => {
			const selectedElement =
				newEditingElementIndex === undefined
					? undefined
					: elements[ newEditingElementIndex ];
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
				<PaletteHeading level={ paletteLabelHeadingLevel }>
					{ paletteLabel }
				</PaletteHeading>
				<PaletteActionsContainer>
					{ hasElements && isEditing && (
						<DoneButton
							size="small"
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
							size="small"
							isPressed={ isAdding }
							icon={ plus }
							label={
								isGradient
									? __( 'Add gradient' )
									: __( 'Add color' )
							}
							onClick={ () => {
								const optionName = getNameForPosition(
									elements,
									slugPrefix
								);

								if ( !! gradients ) {
									onChange( [
										...gradients,
										{
											gradient: DEFAULT_GRADIENT,
											name: optionName,
											slug:
												slugPrefix +
												kebabCase( optionName ),
										},
									] );
								} else {
									onChange( [
										...colors,
										{
											color: DEFAULT_COLOR,
											name: optionName,
											slug:
												slugPrefix +
												kebabCase( optionName ),
										},
									] );
								}
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
									size: 'small',
								} }
							>
								{ ( { onClose }: { onClose: () => void } ) => (
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
						<PaletteEditListView< ( typeof elements )[ number ] >
							canOnlyChangeValues={ canOnlyChangeValues }
							elements={ elements }
							// @ts-expect-error TODO: Don't know how to resolve
							onChange={ onChange }
							editingElement={ editingElement }
							setEditingElement={ setEditingElement }
							slugPrefix={ slugPrefix }
							isGradient={ isGradient }
							popoverProps={ popoverProps }
						/>
					) }
					{ ! isEditing && editingElement !== null && (
						<ColorPickerPopover
							isGradient={ isGradient }
							onClose={ () => setEditingElement( null ) }
							onChange={ (
								newElement: ( typeof elements )[ number ]
							) => {
								debounceOnChange(
									// @ts-expect-error TODO: Don't know how to resolve
									elements.map(
										(
											currentElement: ( typeof elements )[ number ],
											currentIndex: number
										) => {
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
							element={ elements[ editingElement ?? -1 ] }
							popoverProps={ popoverProps }
						/>
					) }
					{ ! isEditing &&
						( isGradient ? (
							<GradientPicker
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

export default PaletteEdit;

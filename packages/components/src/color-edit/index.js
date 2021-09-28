/**
 * External dependencies
 */
import classnames from 'classnames';
import { isEmpty, kebabCase } from 'lodash';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { useEffect, useState } from '@wordpress/element';
import { edit, close, chevronDown, chevronUp, plus } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import Dropdown from '../dropdown';
import CircularOptionPicker from '../circular-option-picker';
import ColorPicker from '../color-picker';
import Button from '../button';
import TextControl from '../text-control';
import BaseControl from '../base-control';

function DropdownOpenOnMount( { shouldOpen, isOpen, onToggle } ) {
	useEffect( () => {
		if ( shouldOpen && ! isOpen ) {
			onToggle();
		}
	}, [] );
	return null;
}

function ColorOption( {
	color,
	name,
	slug,
	onChange,
	onRemove,
	onConfirm,
	confirmLabel = __( 'OK' ),
	isEditingNameOnMount = false,
	isEditingColorOnMount = false,
	onCancel,
	immutableColorSlugs = [],
} ) {
	const [ isHover, setIsHover ] = useState( false );
	const [ isFocused, setIsFocused ] = useState( false );
	const [ isEditingName, setIsEditingName ] = useState(
		isEditingNameOnMount
	);
	const [ isShowingAdvancedPanel, setIsShowingAdvancedPanel ] = useState(
		false
	);

	const isShowingControls =
		( isHover || isFocused || isEditingName || isShowingAdvancedPanel ) &&
		! immutableColorSlugs.includes( slug );

	return (
		<div
			tabIndex={ 0 }
			className={ classnames( 'components-color-edit__color-option', {
				'is-hover':
					isHover && ! isEditingName && ! isShowingAdvancedPanel,
			} ) }
			onMouseEnter={ () => setIsHover( true ) }
			onMouseLeave={ () => setIsHover( false ) }
			onFocus={ () => setIsFocused( true ) }
			onBlur={ () => setIsFocused( false ) }
			aria-label={
				name
					? // translators: %s: The name of the color e.g: "vivid red".
					  sprintf( __( 'Color: %s' ), name )
					: // translators: %s: color hex code e.g: "#f00".
					  sprintf( __( 'Color code: %s' ), color )
			}
		>
			<div className="components-color-edit__color-option-main-area">
				<Dropdown
					renderToggle={ ( { isOpen, onToggle } ) => (
						<>
							<DropdownOpenOnMount
								shouldOpen={ isEditingColorOnMount }
								isOpen={ isOpen }
								onToggle={ onToggle }
							/>
							<CircularOptionPicker.Option
								style={ { backgroundColor: color, color } }
								aria-expanded={ isOpen }
								aria-haspopup="true"
								onClick={ onToggle }
								aria-label={ __( 'Edit color value' ) }
							/>
						</>
					) }
					renderContent={ () => (
						<ColorPicker
							color={ color }
							onChangeComplete={ ( newColor ) =>
								onChange( {
									color: newColor.hex,
									slug,
									name,
								} )
							}
							disableAlpha
						/>
					) }
				/>
				{ ! isEditingName && (
					<div className="components-color-edit__color-option-color-name">
						{ name }
					</div>
				) }
				{ isEditingName && (
					<>
						<TextControl
							className="components-color-edit__color-option-color-name-input"
							hideLabelFromVision
							onChange={ ( newColorName ) =>
								onChange( {
									color,
									slug: kebabCase( newColorName ),
									name: newColorName,
								} )
							}
							label={ __( 'Color name' ) }
							placeholder={ __( 'Name' ) }
							value={ name }
						/>
						<Button
							onClick={ () => {
								setIsEditingName( false );
								setIsFocused( false );
								if ( onConfirm ) {
									onConfirm();
								}
							} }
							variant="primary"
						>
							{ confirmLabel }
						</Button>
					</>
				) }
				{ ! isEditingName && (
					<>
						<Button
							className={ classnames( {
								'components-color-edit__hidden-control': ! isShowingControls,
							} ) }
							icon={ edit }
							label={ __( 'Edit color name' ) }
							onClick={ () => setIsEditingName( true ) }
						/>
						<Button
							className={ classnames( {
								'components-color-edit__hidden-control': ! isShowingControls,
							} ) }
							icon={ close }
							label={ __( 'Remove color' ) }
							onClick={ onRemove }
						/>
					</>
				) }
				<Button
					className={ classnames( {
						'components-color-edit__hidden-control': ! isShowingControls,
					} ) }
					icon={ isShowingAdvancedPanel ? chevronUp : chevronDown }
					label={ __( 'Additional color settings' ) }
					onClick={ () => {
						if ( isShowingAdvancedPanel ) {
							setIsFocused( false );
						}
						setIsShowingAdvancedPanel( ! isShowingAdvancedPanel );
					} }
					aria-expanded={ isShowingAdvancedPanel }
				/>
			</div>
			{ onCancel && (
				<Button
					className="components-color-edit__cancel-button"
					onClick={ onCancel }
				>
					{ __( 'Cancel' ) }
				</Button>
			) }
			{ isShowingAdvancedPanel && (
				<TextControl
					className="components-color-edit__slug-input"
					onChange={ ( newSlug ) =>
						onChange( {
							color,
							slug: newSlug,
							name,
						} )
					}
					label={ __( 'Slug' ) }
					value={ slug }
				/>
			) }
		</div>
	);
}

function ColorInserter( { onInsert, onCancel } ) {
	const [ color, setColor ] = useState( {
		color: '#fff',
		name: '',
		slug: '',
	} );
	return (
		<ColorOption
			color={ color.color }
			name={ color.name }
			slug={ color.slug }
			onChange={ setColor }
			confirmLabel={ __( 'Save' ) }
			onConfirm={ () => onInsert( color ) }
			isEditingNameOnMount
			isEditingColorOnMount
			onCancel={ onCancel }
		/>
	);
}

export default function ColorEdit( {
	colors,
	onChange,
	emptyUI,
	immutableColorSlugs,
	canReset = true,
} ) {
	const [ isInsertingColor, setIsInsertingColor ] = useState( false );
	return (
		<BaseControl>
			<fieldset>
				<div className="components-color-edit__label-and-insert-container">
					<legend>
						<div>
							<BaseControl.VisualLabel>
								{ __( 'Color palette' ) }
							</BaseControl.VisualLabel>
						</div>
					</legend>
					{ ! isInsertingColor && (
						<Button
							onClick={ () => {
								setIsInsertingColor( true );
							} }
							className="components-color-edit__insert-button"
							icon={ plus }
						/>
					) }
				</div>
				<div>
					{ ! isEmpty( colors ) &&
						colors.map( ( color, index ) => {
							return (
								<ColorOption
									key={ index }
									color={ color.color }
									name={ color.name }
									slug={ color.slug }
									immutableColorSlugs={ immutableColorSlugs }
									onChange={ ( newColor ) => {
										onChange(
											colors.map(
												(
													currentColor,
													currentIndex
												) => {
													if (
														currentIndex === index
													) {
														return newColor;
													}
													return currentColor;
												}
											)
										);
									} }
									onRemove={ () => {
										onChange(
											colors.filter(
												(
													_currentColor,
													currentIndex
												) => {
													if (
														currentIndex === index
													) {
														return false;
													}
													return true;
												}
											)
										);
									} }
								/>
							);
						} ) }
					{ isInsertingColor && (
						<ColorInserter
							onInsert={ ( newColor ) => {
								setIsInsertingColor( false );
								onChange( [ ...( colors || [] ), newColor ] );
							} }
							onCancel={ () => setIsInsertingColor( false ) }
						/>
					) }
					{ ! isInsertingColor && isEmpty( colors ) && emptyUI }
				</div>
				{ !! canReset && (
					<Button
						isSmall
						variant="secondary"
						className="components-color-edit__reset-button"
						onClick={ () => onChange() }
					>
						{ __( 'Reset' ) }
					</Button>
				) }
			</fieldset>
		</BaseControl>
	);
}

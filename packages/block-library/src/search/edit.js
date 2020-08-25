/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	__experimentalBlock as Block,
	BlockControls,
	InspectorControls,
	RichText,
	__experimentalUnitControl as UnitControl,
} from '@wordpress/block-editor';
import {
	DropdownMenu,
	MenuGroup,
	MenuItem,
	ToolbarGroup,
	Button,
	ToolbarButton,
	ResizableBox,
	PanelBody,
	BaseControl,
} from '@wordpress/components';
import { useInstanceId } from '@wordpress/compose';
import { search } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	buttonOnly,
	buttonOutside,
	buttonInside,
	noButton,
	buttonWithIcon,
	toggleLabel,
} from './icons';

export default function SearchEdit( {
	className,
	attributes,
	setAttributes,
	toggleSelection,
	isSelected,
} ) {
	const {
		label,
		showLabel,
		placeholder,
		width,
		align,
		buttonText,
		buttonPosition,
		buttonUseIcon,
	} = attributes;

	const MIN_WIDTH = 220;
	const unitControlInstanceId = useInstanceId( UnitControl );
	const unitControlInputId = `wp-block-search__width-${ unitControlInstanceId }`;

	const getBlockClassNames = () => {
		return classnames(
			className,
			'button-inside' === buttonPosition
				? 'wp-block-search__button-inside'
				: undefined,
			'button-outside' === buttonPosition
				? 'wp-block-search__button-outside'
				: undefined,
			'no-button' === buttonPosition
				? 'wp-block-search__no-button'
				: undefined,
			'button-only' === buttonPosition
				? 'wp-block-search__button-only'
				: undefined,
			buttonUseIcon && 'no-button' !== buttonPosition
				? 'wp-block-search__text-button'
				: undefined,
			! buttonUseIcon && 'no-button' !== buttonPosition
				? 'wp-block-search__icon-button'
				: undefined
		);
	};

	const getButtonPositionIcon = () => {
		switch ( buttonPosition ) {
			case 'button-inside':
				return buttonInside;
			case 'button-outside':
				return buttonOutside;
			case 'no-button':
				return noButton;
			case 'button-only':
				return buttonOnly;
		}
	};

	const getResizableSides = () => {
		if ( 'button-only' === buttonPosition ) {
			return {};
		}

		return {
			right: align === 'right' ? false : true,
			left: align === 'right' ? true : false,
		};
	};

	const renderTextField = () => {
		return (
			<input
				className="wp-block-search__input"
				aria-label={ __( 'Optional placeholder text' ) }
				// We hide the placeholder field's placeholder when there is a value. This
				// stops screen readers from reading the placeholder field's placeholder
				// which is confusing.
				placeholder={
					placeholder ? undefined : __( 'Optional placeholder…' )
				}
				value={ placeholder }
				onChange={ ( event ) =>
					setAttributes( { placeholder: event.target.value } )
				}
			/>
		);
	};

	const renderButton = () => {
		return (
			<>
				{ buttonUseIcon && (
					<Button
						icon={ search }
						className="wp-block-search__button"
					/>
				) }

				{ ! buttonUseIcon && (
					<RichText
						className="wp-block-search__button"
						aria-label={ __( 'Button text' ) }
						placeholder={ __( 'Add button text…' ) }
						withoutInteractiveFormatting
						value={ buttonText }
						onChange={ ( html ) =>
							setAttributes( { buttonText: html } )
						}
					/>
				) }
			</>
		);
	};

	const controls = (
		<>
			<BlockControls>
				<ToolbarGroup>
					<ToolbarButton
						title={ __( 'Toggle Search Label' ) }
						icon={ toggleLabel }
						onClick={ () => {
							setAttributes( {
								showLabel: ! showLabel,
							} );
						} }
						className={ showLabel ? 'is-pressed' : undefined }
					/>
				</ToolbarGroup>

				<ToolbarGroup>
					<DropdownMenu
						icon={ getButtonPositionIcon() }
						label={ __( 'Change Button Position' ) }
					>
						{ ( { onClose } ) => (
							<MenuGroup className="wp-block-search__button-position-menu">
								<MenuItem
									icon={ noButton }
									onClick={ () => {
										setAttributes( {
											buttonPosition: 'no-button',
										} );
										onClose();
									} }
								>
									{ __( 'No Button' ) }
								</MenuItem>
								<MenuItem
									icon={ buttonOutside }
									onClick={ () => {
										setAttributes( {
											buttonPosition: 'button-outside',
										} );
										onClose();
									} }
								>
									{ __( 'Button Outside' ) }
								</MenuItem>
								<MenuItem
									icon={ buttonInside }
									onClick={ () => {
										setAttributes( {
											buttonPosition: 'button-inside',
										} );
										onClose();
									} }
								>
									{ __( 'Button Inside' ) }
								</MenuItem>
								<MenuItem
									icon={ buttonOnly }
									onClick={ () => {
										setAttributes( {
											buttonPosition: 'button-only',
										} );
										onClose();
									} }
								>
									{ __( 'Button Only' ) }
								</MenuItem>
							</MenuGroup>
						) }
					</DropdownMenu>

					{ 'no-button' !== buttonPosition && (
						<ToolbarButton
							title={ __( 'Use Button with Icon' ) }
							icon={ buttonWithIcon }
							onClick={ () => {
								setAttributes( {
									buttonUseIcon: ! buttonUseIcon,
								} );
							} }
							className={
								buttonUseIcon ? 'is-pressed' : undefined
							}
						/>
					) }
				</ToolbarGroup>
			</BlockControls>

			<InspectorControls>
				<PanelBody title={ __( 'Display Settings' ) }>
					<BaseControl
						label={ __( 'Width' ) }
						id={ unitControlInputId }
					>
						<UnitControl
							id={ unitControlInputId }
							min={ MIN_WIDTH }
							onChange={ ( newWidth ) =>
								setAttributes( { width: newWidth } )
							}
							style={ { maxWidth: 80 } }
							value={ width }
						/>
					</BaseControl>
				</PanelBody>
			</InspectorControls>
		</>
	);

	return (
		<Block.div className={ getBlockClassNames() }>
			{ controls }

			{ showLabel && (
				<RichText
					className="wp-block-search__label"
					aria-label={ __( 'Label text' ) }
					placeholder={ __( 'Add label…' ) }
					withoutInteractiveFormatting
					value={ label }
					onChange={ ( html ) => setAttributes( { label: html } ) }
				/>
			) }

			<ResizableBox
				size={ {
					width,
				} }
				className="wp-block-search__inside-wrapper"
				minWidth={ MIN_WIDTH }
				enable={ getResizableSides() }
				onResizeStart={ () => {
					toggleSelection( false );
				} }
				onResizeStop={ ( event, direction, elt, delta ) => {
					setAttributes( {
						width: parseInt( width + delta.width, 10 ),
					} );
					toggleSelection( true );
				} }
				showHandle={ isSelected }
			>
				{ ( 'button-inside' === buttonPosition ||
					'button-outside' === buttonPosition ) && (
					<>
						{ renderTextField() }
						{ renderButton() }
					</>
				) }

				{ 'button-only' === buttonPosition && renderButton() }
				{ 'no-button' === buttonPosition && renderTextField() }
			</ResizableBox>
		</Block.div>
	);
}

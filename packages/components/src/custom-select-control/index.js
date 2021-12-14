/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Icon, check, chevronDown } from '@wordpress/icons';
import { __, sprintf } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { DropdownMenu, MenuItem, VisuallyHidden } from '../';

const itemToString = ( item ) => item?.name;

const POPOVER_PROPS = {
	className: 'block-editor-block-settings-menu__popover',
	position: 'bottom right',
	isAlternate: true,
};

export default function CustomSelectControlWithDropdownMenu( {
	className,
	hideLabelFromVision,
	label,
	describedBy,
	options: items,
	onChange: onSelectedItemChange,
	value: selectedItem,
} ) {
	function getDescribedBy() {
		if ( describedBy ) {
			return describedBy;
		}

		if ( ! selectedItem ) {
			return __( 'No selection' );
		}

		// translators: %s: The selected option.
		return sprintf( __( 'Currently selected: %s' ), selectedItem.name );
	}

	const toggleProps = {
		// This is needed because some speech recognition software don't support `aria-labelledby`.
		'aria-label': label,
		'aria-labelledby': undefined,
		className: 'components-custom-select-control__button',
		isSmall: true,
		describedBy: getDescribedBy(),
		children: (
			<>
				{ itemToString( selectedItem ) }
				<Icon
					icon={ chevronDown }
					className="components-custom-select-control__button-icon"
				/>
			</>
		),
	};

	const menuProps = {
		role: 'select',
	};

	return (
		<div
			className={ classnames(
				'components-custom-select-control',
				className
			) }
		>
			{ hideLabelFromVision ? (
				<VisuallyHidden as="label">{ label }</VisuallyHidden>
			) : (
				/* eslint-disable-next-line jsx-a11y/label-has-associated-control, jsx-a11y/label-has-for */
				<label
					{ ...{
						className: 'components-custom-select-control__label',
					} }
				>
					{ label }
				</label>
			) }
			<DropdownMenu
				className={ classnames(
					'components-custom-select-control__inner',
					className
				) }
				menuProps={ menuProps }
				popoverProps={ POPOVER_PROPS }
				toggleProps={ toggleProps }
				icon={ null }
				noIcons={ true }
			>
				{ ( { isOpen, onClose } ) =>
					isOpen && (
						<>
							{ items.map( ( item, index ) => (
								<MenuItem
									key={ index }
									role="option"
									{ ...{
										className: classnames(
											item.className,
											'components-custom-select-control__item',
											{
												'is-highlighted':
													item === selectedItem,
												'has-hint': !! item.__experimentalHint,
												'has-check':
													item === selectedItem,
											}
										),
										style: item.style,
									} }
									onClick={ () => {
										onSelectedItemChange( {
											selectedItem: item,
										} );
										onClose();
									} }
									icon={ item === selectedItem && check }
								>
									{ item.name }
									{ item.__experimentalHint && (
										<span className="components-custom-select-control__item-hint">
											{ item.__experimentalHint }
										</span>
									) }
								</MenuItem>
							) ) }
						</>
					)
				}
			</DropdownMenu>
		</div>
	);
}

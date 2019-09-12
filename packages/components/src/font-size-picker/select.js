/**
 * External dependencies
 */
import { map } from 'lodash';

/**
 * WordPress dependencies
 */
import { __, _x, sprintf } from '@wordpress/i18n';
import { withInstanceId } from '@wordpress/compose';
import { useState, useRef, useCallback, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import {
	Dashicon,
	BaseControl,
	Button,
	NavigableMenu,
	Dropdown,
} from '../';

function FontSizePickerSelect( {
	fontSizes = [],
	onChange,
	value,
} ) {
	const currentFont = fontSizes.find( ( font ) => font.value === value );
	const currentFontName =
    ( currentFont && currentFont.name ) ||
    ( ! value && _x( 'Normal', 'font size name' ) ) ||
    _x( 'Custom', 'font size name' );
	const currentFontSlug = currentFont ? currentFont.slug : '';

	const onChangeValue = ( event ) => {
		const newValue = event.target.value;
		if ( newValue === '' ) {
			onChange( undefined );
			return;
		}
		onChange( Number( newValue ) );
	};

	/**
  * CHANGES
  */
	// Work-around to focus active item
	const popoverRef = useRef( null );
	const focusActiveItem = useCallback( () => {
		// Hack work-arounds to control focus timing...
		window.requestAnimationFrame( () => {
			const { current } = popoverRef;
			if ( ! current ) {
				return;
			}
			const node = current.querySelector( '[aria-selected="true"]' );
			node.blur();
			window.requestAnimationFrame( () => {
				if ( node ) {
					// Hack work-arounds to control focus timing...
					node.focus();
				}
			} );
		} );
	}, [] );

	useEffect( () => {
		focusActiveItem();
	}, [ focusActiveItem, value ] );

	// Work around to manage + force open state outside of Dropdown
	const [ isOpen, setOpen ] = useState( false );
	const openDropdown = () => {
		setOpen( true );
	};
	const closeDropdown = () => setOpen( false );
	const handleOnToggle = ( nextOpen ) => {
		setOpen( nextOpen );
		if ( nextOpen ) {
			focusActiveItem();
		}
	};

	// Work around to force dropdown to open via Button
	const handleOnButtonKeyDown = ( event ) => {
		const { key } = event;
		switch ( key ) {
			case 'ArrowUp':
				openDropdown();
				break;
			case 'ArrowDown':
				openDropdown();
				break;
			default:
		}
	};

	// Work around to prevent scrolling.
	// Need to adjust navigable-content/container
	// https://github.com/WordPress/gutenberg/blob/master/packages/components/src/navigable-container/container.js#L89
	const handleOnKeyDown = ( event ) => {
		// event.preventDefault();
		const { key } = event;
		switch ( key ) {
			case 'ArrowDown':
				event.preventDefault();
				break;
			case 'ArrowUp':
				event.preventDefault();
				break;
			default:
				break;
		}
	};

	// Improve voiceover consistency compared to native select
	const buttonRole = 'combobox';
	const ariaActiveDescendant = `item-${ currentFontSlug }`;
	const ariaHasPopup = 'listbox';
	const ariaProps = {
		role: buttonRole,
		'aria-haspopup': ariaHasPopup,
		'aria-activedescendant': ariaActiveDescendant,
	};

	/**
  * / CHANGES
  */

	return (
		<BaseControl className="components-font-size-picker__select">
			<Dropdown
				className="components-font-size-picker__select-dropdown"
				contentClassName="components-font-size-picker__select-dropdown-content"
				position="bottom"
				focusOnMount="container"
				onChange={ onChangeValue }
				onOpen={ openDropdown }
				onClose={ closeDropdown }
				onToggle={ handleOnToggle }
				isOpen={ isOpen }
				renderToggle={ ( { onToggle } ) => (
					<Button
						className="components-font-size-picker__select-selector"
						isLarge
						onClick={ onToggle }
						aria-expanded={ isOpen }
						aria-label={ sprintf( __( 'Customize font size. %s' ), currentFontName ) }
						onKeyDown={ handleOnButtonKeyDown }
						{ ...ariaProps }
					>
						{ currentFontName }
					</Button>
				) }
				renderContent={ () => {
					return (
						<NavigableMenu
							role="listbox"
							aria-label="Choose Font Size"
							onKeyDown={ handleOnKeyDown }
						>
							<div ref={ popoverRef }>
								{ map( fontSizes, ( option ) => {
									const isSelected = value === option.value;
									const optionLabel = isSelected ? `${ option.label } (Selected)` : option.label;
									const itemId = `item-${ option.value }`;
									const itemRole = 'option';
									const labelRole = 'presentation';

									return (
										<Button
											key={ option.value }
											onClick={ () => {
												onChange( option.value );
												closeDropdown();
											} }
											className={ `is-font-${ option.value }` }
											role={ itemRole }
											id={ itemId }
											aria-label={ optionLabel }
											aria-selected={ isSelected }
										>
											{ isSelected && <Dashicon icon="saved" /> }
											<span
												className="components-font-size-picker__select-dropdown-text-size"
												style={ option.size ? { fontSize: option.size } : {} }
												role={ labelRole }
											>
												{ option.label }
											</span>
										</Button>
									);
								} ) }
							</div>
						</NavigableMenu>
					);
				} }
			/>
		</BaseControl>
	);
}

export default withInstanceId( FontSizePickerSelect );

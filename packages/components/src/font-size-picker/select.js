/**
 * External dependencies
 */
import { map } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { withInstanceId } from '@wordpress/compose';
import { useRef, useCallback, useEffect } from '@wordpress/element';

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
	const currentFontLabel = currentFont ? currentFont.label : '';

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
	const handleOnToggle = ( nextOpen ) => {
		if ( nextOpen ) {
			focusActiveItem();
		}
	};

	// Work around to force dropdown to open via Button
	const handleOnButtonKeyDown = ( event ) => {
		const { key } = event;
		const currentIndex = fontSizes.indexOf( currentFont );
		const highestIndex = fontSizes.length - 1;
		let newIndex;
		switch ( key ) {
			case 'ArrowUp':
				newIndex = currentIndex > 0 ? currentIndex - 1 : highestIndex;
				onChange( fontSizes[ newIndex ].value );
				break;
			case 'ArrowDown':
				newIndex = currentIndex < highestIndex ? currentIndex + 1 : 0;
				onChange( fontSizes[ newIndex ].value );
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
	const ariaHasPopup = 'listbox';
	const ariaProps = {
		'aria-haspopup': ariaHasPopup,
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
				onToggle={ handleOnToggle }
				renderToggle={ ( { onToggle } ) => (
					// eslint-disable-next-line jsx-a11y/label-has-for
					<label className="components-font-size-picker__select-label">
						{ __( 'Preset Size' ) }
						<Button
							className="components-font-size-picker__select-selector"
							isLarge
							onClick={ onToggle }
							onKeyDown={ handleOnButtonKeyDown }
							{ ...ariaProps }
						>
							{ currentFontLabel }
						</Button>
					</label>
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

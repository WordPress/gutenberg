/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import {
	Button,
	TextControl,
	__experimentalVStack as VStack,
	__experimentalHStack as HStack,
	__experimentalText as Text,
} from '@wordpress/components';
import { plus, closeSmall } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import './style.scss';

/**
 * Repeater control for managing a list of text items.
 *
 * @param {Object}   props             Component props.
 * @param {string}   props.label       Field label.
 * @param {Array}    props.items       Array of string items.
 * @param {Function} props.onChange    Change handler.
 * @param {string}   props.placeholder Placeholder text for new items.
 * @param {Function} props.onDirty     Optional dirty callback.
 * @return {JSX.Element} Repeater control.
 */
export default function RepeaterControl( {
	label,
	items = [],
	onChange,
	placeholder = '',
	onDirty = () => {},
} ) {
	const [ newItem, setNewItem ] = useState( '' );

	const addItem = () => {
		if ( newItem.trim() ) {
			onChange( [ ...items, newItem.trim() ] );
			setNewItem( '' );
			onDirty();
		}
	};

	const removeItem = ( index ) => {
		const newItems = [ ...items ];
		newItems.splice( index, 1 );
		onChange( newItems );
		onDirty();
	};

	const updateItem = ( index, value ) => {
		const newItems = [ ...items ];
		newItems[ index ] = value;
		onChange( newItems );
		onDirty();
	};

	const handleKeyDown = ( event ) => {
		if ( event.key === 'Enter' ) {
			event.preventDefault();
			addItem();
		}
	};

	return (
		<div className="repeater-control">
			{ label && (
				<Text className="repeater-control__label">{ label }</Text>
			) }
			<VStack spacing={ 2 }>
				{ items.map( ( item, index ) => (
					<HStack key={ index } spacing={ 2 } alignment="center">
						<TextControl
							__nextHasNoMarginBottom
							__next40pxDefaultSize
							className="repeater-control__input"
							value={ item }
							onChange={ ( value ) => updateItem( index, value ) }
						/>
						<Button
							icon={ closeSmall }
							label={ __( 'Remove' ) }
							onClick={ () => removeItem( index ) }
							size="small"
							className="repeater-control__remove"
						/>
					</HStack>
				) ) }
				<HStack spacing={ 2 } alignment="center">
					<TextControl
						__nextHasNoMarginBottom
						__next40pxDefaultSize
						className="repeater-control__input"
						value={ newItem }
						onChange={ setNewItem }
						placeholder={ placeholder }
						onKeyDown={ handleKeyDown }
					/>
					<Button
						icon={ plus }
						label={ __( 'Add' ) }
						onClick={ addItem }
						size="small"
						className="repeater-control__add"
						disabled={ ! newItem.trim() }
						accessibleWhenDisabled
					/>
				</HStack>
			</VStack>
		</div>
	);
}

/**
 * WordPress dependencies
 */
import {
	Dropdown,
	Button,
	__experimentalInputControl as InputControl,
	CheckboxControl,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { sprintf, __ } from '@wordpress/i18n';
import { chevronDown } from '@wordpress/icons';
import { useState } from '@wordpress/element';

const noop = () => {};

export default function FilterControl( {
	label,
	value = [],
	options = [],
	onChange = noop,
} ) {
	const [ searchFilter, setSearchFilter ] = useState( '' );
	return (
		<Dropdown
			popoverProps={ { placement: 'bottom-start' } }
			renderToggle={ ( { onToggle, isOpen } ) => (
				<Button
					variant="secondary"
					text={ getToggleText( label, value ) }
					icon={ chevronDown }
					iconPosition="right"
					isPressed={ isOpen }
					onClick={ onToggle }
				/>
			) }
			renderContent={ () => (
				<VStack style={ { minWidth: 280 } }>
					<InputControl
						placeholder={ __( 'Search' ) }
						size="__unstable-large"
						value={ searchFilter }
						onChange={ setSearchFilter }
					/>
					{ options
						.filter( ( option ) =>
							option.label
								.toLowerCase()
								.includes( searchFilter.toLowerCase() )
						)
						.map( ( option ) => (
							<CheckboxControl
								key={ option.value }
								label={ option.label }
								checked={ value.includes( option.value ) }
								onChange={ ( checked ) => {
									if ( checked ) {
										onChange( [ ...value, option.value ] );
									} else {
										onChange(
											value.filter(
												( v ) => v !== option.value
											)
										);
									}
								} }
								__nextHasNoMarginBottom
							/>
						) ) }
					<Button
						style={ {
							width: '100%',
							justifyContent: 'center',
						} }
						variant="tertiary"
						onClick={ () => onChange( [] ) }
						__next40pxDefaultSize
					>
						{ __( 'Clear' ) }
					</Button>
				</VStack>
			) }
		/>
	);
}

function getToggleText( label, value ) {
	if ( value.length > 1 ) {
		return sprintf(
			/* translators: %1$s: label, %2$d: number of selected items */
			__( '%1$s: %2$d selected' ),
			label,
			value.length
		);
	} else if ( value.length === 1 ) {
		return sprintf(
			/* translators: %1$s: label, %2$s: selected item */
			__( '%1$s: %2$s' ),
			label,
			value[ 0 ]
		);
	}
	return label;
}

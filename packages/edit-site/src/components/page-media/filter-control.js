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
	placeholder,
	value = [],
	options = [],
	multiple = false,
	hideSearch = false,
	hideClear = false,
	onChange = noop,
	onCreate,
	children,
} ) {
	const [ searchFilter, setSearchFilter ] = useState( '' );
	return (
		<Dropdown
			popoverProps={ { placement: 'bottom-start' } }
			renderToggle={ ( { onToggle, isOpen } ) =>
				children ? (
					children( { onToggle, isOpen } )
				) : (
					<Button
						variant="secondary"
						text={ getToggleText( label, value, options ) }
						icon={ chevronDown }
						iconPosition="right"
						isPressed={ isOpen }
						onClick={ onToggle }
						__next40pxDefaultSize
					/>
				)
			}
			renderContent={ ( { onClose } ) => (
				<VStack style={ { minWidth: 280 } }>
					{ ! hideSearch && (
						<InputControl
							placeholder={ placeholder ?? __( 'Search' ) }
							size="__unstable-large"
							value={ searchFilter }
							onChange={ setSearchFilter }
						/>
					) }
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
									if ( multiple ) {
										if ( checked ) {
											onChange( [
												...value,
												option.value,
											] );
										} else {
											onChange(
												value.filter(
													( v ) => v !== option.value
												)
											);
										}
									} else {
										onChange( [ option.value ] );
									}
								} }
								__nextHasNoMarginBottom
							/>
						) ) }
					{ !! onCreate && searchFilter !== '' && (
						<Button
							onClick={ () => {
								onCreate( searchFilter );
								onClose();
							} }
						>
							{ sprintf(
								/* translators: %s: search term */
								__( 'Create "%s"' ),
								searchFilter
							) }
						</Button>
					) }
					{ multiple && ! hideClear && (
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
					) }
				</VStack>
			) }
		/>
	);
}

function getToggleText( label, value, options ) {
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
			options.find( ( option ) => option.value === value[ 0 ] )?.label ??
				value[ 0 ]
		);
	}
	return label;
}

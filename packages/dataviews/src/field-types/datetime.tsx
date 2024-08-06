/**
 * External dependencies
 */
import type { ComponentType } from 'react';

/**
 * WordPress dependencies
 */
import {
	Button,
	DateTimePicker,
	Dropdown,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	BaseControl,
} from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { closeSmall } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import { dateI18n, getDate, getSettings } from '@wordpress/date';

/**
 * Internal dependencies
 */
import type {
	SortDirection,
	ValidationContext,
	DataFormControlProps,
} from '../types';

function getFormattedDate( value: string | null ) {
	return dateI18n(
		getSettings().formats.datetimeAbbreviated,
		getDate( value ),
		undefined
	);
}

function sort( a: any, b: any, direction: SortDirection ) {
	const timeA = new Date( a ).getTime();
	const timeB = new Date( b ).getTime();

	return direction === 'asc' ? timeA - timeB : timeB - timeA;
}

function isValid( value: any, context?: ValidationContext ) {
	if ( context?.elements ) {
		const validValues = context?.elements.map( ( f ) => f.value );
		if ( ! validValues.includes( value ) ) {
			return false;
		}
	}

	return true;
}

interface DateTimePickerControlProps {
	title: string;
	value: string;
	onChange: ( newValue: string | null ) => void;
	onClose: () => void;
}

const DateTimePickerForm: ComponentType< DateTimePickerControlProps > = ( {
	title,
	value,
	onChange,
	onClose,
} ) => {
	return (
		<VStack>
			<HStack>
				<span>{ title }</span>
				<Button
					label={ __( 'Close' ) }
					icon={ closeSmall }
					onClick={ onClose }
				/>
			</HStack>
			<DateTimePicker
				currentDate={ value }
				onChange={ onChange }
				is12Hour
			/>
		</VStack>
	);
};

function Edit< Item >( {
	data,
	field,
	onChange,
}: DataFormControlProps< Item > ) {
	const { id, label, description } = field;
	const value = field.getValue( { item: data } ) ?? '';
	const onChangeControl = useCallback(
		( newValue: string | null ) =>
			onChange( ( prevItem: Item ) => ( {
				...prevItem,
				[ id ]: newValue,
			} ) ),
		[ id, onChange ]
	);

	return (
		<Dropdown
			renderToggle={ ( { onToggle, isOpen } ) => (
				<BaseControl id={ id } label={ label }>
					<Button
						size="compact"
						variant="tertiary"
						onClick={ onToggle }
						aria-expanded={ isOpen }
						aria-label={ label }
						label={ description }
					>
						{ getFormattedDate( value ) }
					</Button>
				</BaseControl>
			) }
			renderContent={ ( { onClose } ) => (
				<DateTimePickerForm
					onClose={ onClose }
					title={ label }
					value={ value }
					onChange={ onChangeControl }
				/>
			) }
		/>
	);
}

export default {
	sort,
	isValid,
	Edit,
};

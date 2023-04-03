/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { insertObject, useAnchor } from '@wordpress/rich-text';
import {
	RichTextToolbarButton,
	__experimentalDateFormatPicker as DateFormatPicker,
} from '@wordpress/block-editor';
import { formatListNumbered } from '@wordpress/icons';
import { dateI18n, getSettings as getDateSettings } from '@wordpress/date';
import { useEffect, useRef, useState } from '@wordpress/element';
import { Popover, DateTimePicker } from '@wordpress/components';

const name = 'core/time';
const title = __( 'Date/Time' );

const DEFAULT_FORMAT = 'Y';

// Shamelessly copied from https://overreacted.io/making-setinterval-declarative-with-react-hooks/
function useInterval( callback, delay ) {
	const savedCallback = useRef();

	// Remember the latest callback.
	useEffect( () => {
		savedCallback.current = callback;
	}, [ callback ] );

	// Set up the interval.
	useEffect( () => {
		function tick() {
			savedCallback.current();
		}
		if ( delay !== null ) {
			const id = setInterval( tick, delay );
			return () => clearInterval( id );
		}
	}, [ delay ] );
}

function useNow() {
	const [ now, setNow ] = useState( new Date() );

	useInterval( () => {
		setNow( new Date() );
	}, 1000 );

	return now;
}

export const time = {
	name,
	title,
	tagName: 'data',
	className: null,
	render: function Render( { attributes } ) {
		const now = useNow();
		const { date = now, format } = attributes;
		const dateSettings = getDateSettings();

		return (
			<time dateTime={ dateI18n( 'c', date ) }>
				{ dateI18n( format || dateSettings.formats.datetime, date ) }
			</time>
		);
	},
	edit( {
		isObjectActive,
		value,
		onChange,
		onFocus,
		contentRef,
		activeObjectAttributes,
	} ) {
		function onClick() {
			const newValue = insertObject( value, {
				type: name,
				attributes: {
					format: DEFAULT_FORMAT,
				},
				tagName: 'data',
			} );
			newValue.start = newValue.end - 1;
			onChange( newValue );
			onFocus();
		}

		return (
			<>
				<RichTextToolbarButton
					icon={ formatListNumbered }
					title={ title }
					onClick={ onClick }
					isActive={ isObjectActive }
				/>
				{ isObjectActive && (
					<InlineUI
						value={ value }
						onChange={ onChange }
						activeObjectAttributes={ activeObjectAttributes }
						contentRef={ contentRef }
					/>
				) }
			</>
		);
	},
};

function InlineUI( { value, onChange, activeObjectAttributes, contentRef } ) {
	const { date, format } = activeObjectAttributes;
	const popoverAnchor = useAnchor( {
		editableContentElement: contentRef.current,
		settings: time,
	} );

	return (
		<Popover
			placement="bottom"
			focusOnMount={ true }
			anchor={ popoverAnchor }
			className="components-dropdown__content"
		>
			<DateFormatPicker
				format={ format || DEFAULT_FORMAT }
				defaultFormat={ DEFAULT_FORMAT }
				onChange={ ( newFormat ) => {
					const newReplacements = value.replacements.slice();

					newReplacements[ value.start ] = {
						tagName: 'data',
						type: name,
						attributes: {
							...activeObjectAttributes,
							format: newFormat,
						},
					};

					onChange( {
						...value,
						replacements: newReplacements,
					} );
				} }
			/>
			<DateTimePicker
				currentDate={ date }
				onChange={ ( newDate ) => {
					const newReplacements = value.replacements.slice();

					newReplacements[ value.start ] = {
						tagName: 'data',
						type: name,
						attributes: {
							...activeObjectAttributes,
							date: newDate,
						},
					};

					onChange( {
						...value,
						replacements: newReplacements,
					} );
				} }
			/>
		</Popover>
	);
}

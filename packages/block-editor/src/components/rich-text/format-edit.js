/**
 * WordPress dependencies
 */
import {
	getActiveFormat,
	getActiveObject,
	isCollapsed,
} from '@wordpress/rich-text';
/**
 * External dependencies
 */
import { find } from 'lodash';

export default function FormatEdit( {
	formatTypes,
	onChange,
	onFocus,
	value,
	forwardedRef,
} ) {
	return formatTypes.map( ( settings ) => {
		const { name, edit: Edit } = settings;

		if ( ! Edit ) {
			return null;
		}

		const activeFormat = getActiveFormat( value, name );
		let isActive = activeFormat !== undefined;
		const activeObject = getActiveObject( value );
		const isObjectActive =
			activeObject !== undefined && activeObject.type === name;

		// Edge case: un-collapsed link formats.
		// If there is a missing link format at either end of the selection
		// then we shouldn't show the Edit UI because the selection has exceeded
		// the bounds of the link format.
		// Also if the format objects don't match then we're dealing with two separate
		// links so we should not allow the link to be modified over the top.
		if ( name === 'core/link' && ! isCollapsed( value ) ) {
			const formats = value.formats;

			const linkFormatAtStart = find( formats[ value.start ], {
				type: 'core/link',
			} );

			const linkFormatAtEnd = find( formats[ value.end - 1 ], {
				type: 'core/link',
			} );

			if (
				! linkFormatAtStart ||
				! linkFormatAtEnd ||
				linkFormatAtStart !== linkFormatAtEnd
			) {
				isActive = false;
			}
		}

		return (
			<Edit
				key={ name }
				isActive={ isActive }
				activeAttributes={
					isActive ? activeFormat.attributes || {} : {}
				}
				isObjectActive={ isObjectActive }
				activeObjectAttributes={
					isObjectActive ? activeObject.attributes || {} : {}
				}
				value={ value }
				onChange={ onChange }
				onFocus={ onFocus }
				contentRef={ forwardedRef }
			/>
		);
	} );
}

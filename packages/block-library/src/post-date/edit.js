/**
 * WordPress dependencies
 */
import { useEntityProp, useEntityId } from '@wordpress/core-data';
import { __experimentalGetSettings, dateI18n } from '@wordpress/date';
import { Popover, DateTimePicker, ToolbarGroup } from '@wordpress/components';
import { BlockControls } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

function PostDateEditor( { format, setAttributes, isSelected } ) {
	const [ siteFormat ] = useEntityProp( 'root', 'site', 'date_format' );
	const [ date, setDate ] = useEntityProp( 'postType', 'post', 'date' );
	const settings = __experimentalGetSettings();
	const is12Hour = /a(?!\\)/i.test(
		settings.formats.time
			.toLowerCase()
			.replace( /\\\\/g, '' )
			.split( '' )
			.reverse()
			.join( '' )
	);
	return date ? (
		<time dateTime={ dateI18n( 'c', date ) }>
			{ dateI18n( format || siteFormat || settings.formats.date, date ) }
			{ isSelected && (
				<Popover>
					<DateTimePicker
						currentDate={ date }
						onChange={ setDate }
						is12Hour={ is12Hour }
					/>
				</Popover>
			) }
			<BlockControls>
				<ToolbarGroup
					icon="edit"
					title={ __( 'Date Format' ) }
					controls={ Object.keys( settings.formats ).map( ( formatKey ) => ( {
						title: dateI18n( settings.formats[ formatKey ], date ),
						onClick() {
							setAttributes( { format: settings.formats[ formatKey ] } );
						},
						isActive: settings.formats[ formatKey ] === format,
					} ) ) }
					isCollapsed
				/>
			</BlockControls>
		</time>
	) : (
		__( 'No Date' )
	);
}

export default function PostDateEdit( {
	attributes: { format },
	setAttributes,
	isSelected,
} ) {
	if ( ! useEntityId( 'postType', 'post' ) ) {
		return 'Post Date Placeholder';
	}
	return (
		<PostDateEditor
			format={ format }
			setAttributes={ setAttributes }
			isSelected={ isSelected }
		/>
	);
}

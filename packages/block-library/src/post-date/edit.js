/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useEntityProp, store as coreStore } from '@wordpress/core-data';
import { useMemo, useState } from '@wordpress/element';
import { dateI18n, getSettings as getDateSettings } from '@wordpress/date';
import {
	AlignmentControl,
	BlockControls,
	InspectorControls,
	useBlockProps,
	__experimentalDateFormatPicker as DateFormatPicker,
	__experimentalPublishDateTimePicker as PublishDateTimePicker,
} from '@wordpress/block-editor';
import {
	Dropdown,
	ToolbarGroup,
	ToolbarButton,
	ToggleControl,
	PanelBody,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { edit } from '@wordpress/icons';
import { DOWN } from '@wordpress/keycodes';
import { useSelect } from '@wordpress/data';

export default function PostDateEdit( {
	attributes: { textAlign, format, isLink, displayType },
	context: { postId, postType: postTypeSlug, queryId },
	setAttributes,
} ) {
	const blockProps = useBlockProps( {
		className: classnames( {
			[ `has-text-align-${ textAlign }` ]: textAlign,
		} ),
	} );

	// Use internal state instead of a ref to make sure that the component
	// re-renders when the popover's anchor updates.
	const [ popoverAnchor, setPopoverAnchor ] = useState( null );
	// Memoize popoverProps to avoid returning a new object every time.
	const popoverProps = useMemo(
		() => ( { anchor: popoverAnchor } ),
		[ popoverAnchor ]
	);

	const isDescendentOfQueryLoop = Number.isFinite( queryId );
	const dateSettings = getDateSettings();
	const [ siteFormat = dateSettings.formats.date ] = useEntityProp(
		'root',
		'site',
		'date_format'
	);
	const [ siteTimeFormat = dateSettings.formats.time ] = useEntityProp(
		'root',
		'site',
		'time_format'
	);
	const [ date, setDate ] = useEntityProp(
		'postType',
		postTypeSlug,
		displayType,
		postId
	);

	const postType = useSelect(
		( select ) =>
			postTypeSlug
				? select( coreStore ).getPostType( postTypeSlug )
				: null,
		[ postTypeSlug ]
	);

	let postDate = date ? (
		<time dateTime={ dateI18n( 'c', date ) } ref={ setPopoverAnchor }>
			{ dateI18n( format || siteFormat, date ) }
		</time>
	) : (
		__( 'Post Date' )
	);

	if ( isLink && date ) {
		postDate = (
			<a
				href="#post-date-pseudo-link"
				onClick={ ( event ) => event.preventDefault() }
			>
				{ postDate }
			</a>
		);
	}

	return (
		<>
			<BlockControls group="block">
				<AlignmentControl
					value={ textAlign }
					onChange={ ( nextAlign ) => {
						setAttributes( { textAlign: nextAlign } );
					} }
				/>
				{ date && ! isDescendentOfQueryLoop && (
					<ToolbarGroup>
						<Dropdown
							popoverProps={ popoverProps }
							renderContent={ ( { onClose } ) => (
								<PublishDateTimePicker
									currentDate={ date }
									onChange={ setDate }
									is12Hour={ is12HourFormat(
										siteTimeFormat
									) }
									onClose={ onClose }
								/>
							) }
							renderToggle={ ( { isOpen, onToggle } ) => {
								const openOnArrowDown = ( event ) => {
									if ( ! isOpen && event.keyCode === DOWN ) {
										event.preventDefault();
										onToggle();
									}
								};
								return (
									<ToolbarButton
										aria-expanded={ isOpen }
										icon={ edit }
										title={ __( 'Change Date' ) }
										onClick={ onToggle }
										onKeyDown={ openOnArrowDown }
									/>
								);
							} }
						/>
					</ToolbarGroup>
				) }
			</BlockControls>

			<InspectorControls>
				<PanelBody title={ __( 'Settings' ) }>
					<DateFormatPicker
						format={ format }
						defaultFormat={ siteFormat }
						onChange={ ( nextFormat ) =>
							setAttributes( { format: nextFormat } )
						}
					/>
					<ToggleControl
						label={
							postType?.labels.singular_name
								? sprintf(
										// translators: %s: Name of the post type e.g: "post".
										__( 'Link to %s' ),
										postType.labels.singular_name.toLowerCase()
								  )
								: __( 'Link to post' )
						}
						onChange={ () => setAttributes( { isLink: ! isLink } ) }
						checked={ isLink }
					/>
					<ToggleControl
						label={ __( 'Display last modified date' ) }
						onChange={ ( value ) =>
							setAttributes( {
								displayType: value ? 'modified' : 'date',
							} )
						}
						checked={ displayType === 'modified' }
					/>
				</PanelBody>
			</InspectorControls>

			<div { ...blockProps }>{ postDate }</div>
		</>
	);
}

export function is12HourFormat( format ) {
	// To know if the time format is a 12 hour time, look for any of the 12 hour
	// format characters: 'a', 'A', 'g', and 'h'. The character must be
	// unescaped, i.e. not preceded by a '\'. Coincidentally, 'aAgh' is how I
	// feel when working with regular expressions.
	// https://www.php.net/manual/en/datetime.format.php
	return /(?:^|[^\\])[aAgh]/.test( format );
}

/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { store as coreStore } from '@wordpress/core-data';
import { useEffect, useMemo, useState } from '@wordpress/element';
import {
	dateI18n,
	humanTimeDiff,
	getSettings as getDateSettings,
} from '@wordpress/date';
import {
	AlignmentControl,
	BlockControls,
	InspectorControls,
	store as blockEditorStore,
	useBlockProps,
	useBlockEditingMode,
	__experimentalDateFormatPicker as DateFormatPicker,
	__experimentalPublishDateTimePicker as PublishDateTimePicker,
} from '@wordpress/block-editor';
import {
	Dropdown,
	ToolbarGroup,
	ToolbarButton,
	ToggleControl,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { __, _x, sprintf } from '@wordpress/i18n';
import { pencil } from '@wordpress/icons';
import { DOWN } from '@wordpress/keycodes';
import { useSelect, useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { useToolsPanelDropdownMenuProps } from '../utils/hooks';

export default function PostDateEdit( {
	attributes: { datetime, textAlign, format, isLink, metadata },
	context: { postType: postTypeSlug, queryId },
	setAttributes,
} ) {
	const displayType =
		metadata?.bindings?.datetime?.source === 'core/post-data' &&
		metadata?.bindings?.datetime?.args?.field;

	const blockProps = useBlockProps( {
		className: clsx( {
			[ `has-text-align-${ textAlign }` ]: textAlign,
		} ),
	} );
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();

	// Use internal state instead of a ref to make sure that the component
	// re-renders when the popover's anchor updates.
	const [ popoverAnchor, setPopoverAnchor ] = useState( null );
	// Memoize popoverProps to avoid returning a new object every time.
	const popoverProps = useMemo(
		() => ( { anchor: popoverAnchor } ),
		[ popoverAnchor ]
	);

	const { __unstableMarkNextChangeAsNotPersistent } =
		useDispatch( blockEditorStore );

	// We need to set the datetime to a default value upon first loading
	// to discern the block from its legacy version (which would default
	// to the containing post's publish date).
	useEffect( () => {
		if ( datetime === undefined ) {
			__unstableMarkNextChangeAsNotPersistent();
			setAttributes( { datetime: new Date() } );
		}
	}, [ datetime ] );

	const isDescendentOfQueryLoop = Number.isFinite( queryId );
	const dateSettings = getDateSettings();

	const {
		postType,
		siteFormat = dateSettings.formats.date,
		siteTimeFormat = dateSettings.formats.time,
	} = useSelect(
		( select ) => {
			const { getPostType, getEntityRecord } = select( coreStore );
			const siteSettings = getEntityRecord( 'root', 'site' );

			return {
				siteFormat: siteSettings?.date_format,
				siteTimeFormat: siteSettings?.time_format,
				postType: postTypeSlug ? getPostType( postTypeSlug ) : null,
			};
		},
		[ postTypeSlug ]
	);

	const blockEditingMode = useBlockEditingMode();

	let postDate = (
		<time dateTime={ dateI18n( 'c', datetime ) } ref={ setPopoverAnchor }>
			{ format === 'human-diff'
				? humanTimeDiff( datetime )
				: dateI18n( format || siteFormat, datetime ) }
		</time>
	);

	if ( isLink && datetime ) {
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
			{ ( blockEditingMode === 'default' ||
				! isDescendentOfQueryLoop ) && (
				<BlockControls group="block">
					<AlignmentControl
						value={ textAlign }
						onChange={ ( nextAlign ) => {
							setAttributes( { textAlign: nextAlign } );
						} }
					/>

					{ displayType !== 'modified' &&
						! isDescendentOfQueryLoop && (
							<ToolbarGroup>
								<Dropdown
									popoverProps={ popoverProps }
									renderContent={ ( { onClose } ) => (
										<PublishDateTimePicker
											title={
												displayType === 'date'
													? __( 'Publish Date' )
													: __( 'Date' )
											}
											currentDate={ datetime }
											onChange={ ( newDatetime ) =>
												setAttributes( {
													datetime: newDatetime,
												} )
											}
											is12Hour={ is12HourFormat(
												siteTimeFormat
											) }
											onClose={ onClose }
											dateOrder={
												/* translators: Order of day, month, and year. Available formats are 'dmy', 'mdy', and 'ymd'. */
												_x( 'dmy', 'date order' )
											}
										/>
									) }
									renderToggle={ ( { isOpen, onToggle } ) => {
										const openOnArrowDown = ( event ) => {
											if (
												! isOpen &&
												event.keyCode === DOWN
											) {
												event.preventDefault();
												onToggle();
											}
										};
										return (
											<ToolbarButton
												aria-expanded={ isOpen }
												icon={ pencil }
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
			) }

			<InspectorControls>
				<ToolsPanel
					label={ __( 'Settings' ) }
					resetAll={ () => {
						setAttributes( {
							datetime: undefined,
							format: undefined,
							isLink: false,
						} );
					} }
					dropdownMenuProps={ dropdownMenuProps }
				>
					<ToolsPanelItem
						hasValue={ () => !! format }
						label={ __( 'Date Format' ) }
						onDeselect={ () =>
							setAttributes( { format: undefined } )
						}
						isShownByDefault
					>
						<DateFormatPicker
							format={ format }
							defaultFormat={ siteFormat }
							onChange={ ( nextFormat ) =>
								setAttributes( { format: nextFormat } )
							}
						/>
					</ToolsPanelItem>
					<ToolsPanelItem
						hasValue={ () => isLink !== false }
						label={
							postType?.labels.singular_name
								? sprintf(
										// translators: %s: Name of the post type e.g: "post".
										__( 'Link to %s' ),
										postType.labels.singular_name.toLowerCase()
								  )
								: __( 'Link to post' )
						}
						onDeselect={ () => setAttributes( { isLink: false } ) }
						isShownByDefault
					>
						<ToggleControl
							__nextHasNoMarginBottom
							label={
								postType?.labels.singular_name
									? sprintf(
											// translators: %s: Name of the post type e.g: "post".
											__( 'Link to %s' ),
											postType.labels.singular_name.toLowerCase()
									  )
									: __( 'Link to post' )
							}
							onChange={ () =>
								setAttributes( { isLink: ! isLink } )
							}
							checked={ isLink }
						/>
					</ToolsPanelItem>
				</ToolsPanel>
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

import { store as coreStore } from '@wordpress/core-data';
import { useEffect, useMemo, useState } from '@wordpress/element';
import {
	dateI18n,
	humanTimeDiff,
	getSettings as getDateSettings,
} from '@wordpress/date';
import {
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
import { store as blocksStore } from '@wordpress/blocks';
import { useToolsPanelDropdownMenuProps } from '../utils/hooks';
import useDeprecatedTextAlign from '../utils/deprecated-text-align-attributes';

export default function PostDateEdit( props ) {
	const {
		attributes,
		context: { postType: postTypeSlug, queryId },
		setAttributes,
		name,
	} = props;
	useDeprecatedTextAlign( props );
	const { datetime, format, isLink, metadata } = attributes;
	const blockProps = useBlockProps();
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

	const isDescendentOfQueryLoop = Number.isFinite( queryId );

	useEffect( () => {
		const initialAttributes = getInitialAttributes(
			{ datetime, metadata },
			isDescendentOfQueryLoop
		);
		if ( initialAttributes ) {
			__unstableMarkNextChangeAsNotPersistent();
			setAttributes( initialAttributes );
		}
	}, [
		datetime,
		metadata,
		isDescendentOfQueryLoop,
		setAttributes,
		__unstableMarkNextChangeAsNotPersistent,
	] );

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
	const activeBlockVariationName = useSelect(
		( select ) =>
			select( blocksStore ).getActiveBlockVariation( name, attributes )
				?.name,
		[ name, attributes ]
	);

	const blockEditingMode = useBlockEditingMode();

	const validDatetime = datetime || new Date();
	let postDate = (
		<time
			dateTime={ dateI18n( 'c', validDatetime ) }
			ref={ setPopoverAnchor }
		>
			{ format === 'human-diff'
				? humanTimeDiff( validDatetime )
				: dateI18n( format || siteFormat, validDatetime ) }
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
			{ ( blockEditingMode === 'default' || ! isDescendentOfQueryLoop ) &&
				activeBlockVariationName !== 'post-date-modified' &&
				( ! isDescendentOfQueryLoop || ! activeBlockVariationName ) && (
					<BlockControls group="block">
						<ToolbarGroup>
							<Dropdown
								popoverProps={ popoverProps }
								renderContent={ ( { onClose } ) => (
									<PublishDateTimePicker
										title={
											activeBlockVariationName ===
											'post-date'
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
							postType?.labels?.singular_name
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
							label={
								postType?.labels?.singular_name
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

/**
 * Returns the attributes to set on a Date block that has neither a `datetime`
 * attribute nor a binding for it, which is the case right after insertion.
 *
 * Setting one of them discerns the block from its legacy version, which
 * displayed the containing post's publish date. Outside a Query Loop, the
 * block gets the current date. Inside a Query Loop, a fixed date would show
 * the same date for every post, so the block is bound to each post's publish
 * date instead, like the "Post Date" variation.
 *
 * @param {Object}  attributes              Block attributes.
 * @param {string}  [attributes.datetime]   The block's date.
 * @param {Object}  [attributes.metadata]   The block's metadata.
 * @param {boolean} isDescendentOfQueryLoop Whether the block is inside a Query Loop.
 * @return {Object|null} The attributes to set, or `null` if there is nothing to set.
 */
export function getInitialAttributes(
	{ datetime, metadata },
	isDescendentOfQueryLoop
) {
	if ( datetime !== undefined || metadata?.bindings?.datetime ) {
		return null;
	}

	if ( isDescendentOfQueryLoop ) {
		return {
			metadata: {
				...metadata,
				bindings: {
					...metadata?.bindings,
					datetime: {
						source: 'core/post-data',
						args: { field: 'date' },
					},
				},
			},
		};
	}

	return { datetime: new Date() };
}

export function is12HourFormat( format ) {
	// To know if the time format is a 12 hour time, look for any of the 12 hour
	// format characters: 'a', 'A', 'g', and 'h'. The character must be
	// unescaped, i.e. not preceded by a '\'. Coincidentally, 'aAgh' is how I
	// feel when working with regular expressions.
	// https://www.php.net/manual/en/datetime.format.php
	return /(?:^|[^\\])[aAgh]/.test( format );
}

import { useEntityProp } from '@wordpress/core-data';
import {
	dateI18n,
	humanTimeDiff,
	getSettings as getDateSettings,
} from '@wordpress/date';
import {
	InspectorControls,
	useBlockProps,
	__experimentalDateFormatPicker as DateFormatPicker,
} from '@wordpress/block-editor';
import {
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
	// eslint-disable-next-line @wordpress/use-recommended-components
	ToggleControl,
} from '@wordpress/components';
import { __, _x } from '@wordpress/i18n';
import type { BlockEditProps } from '@wordpress/blocks';
import { useToolsPanelDropdownMenuProps } from '../utils/hooks';
import type { CommentDateAttributes, CommentDateBlockContext } from './types';

export default function Edit( {
	attributes: { format, isLink },
	context: { commentId },
	setAttributes,
}: BlockEditProps< CommentDateAttributes > & {
	context: CommentDateBlockContext;
} ) {
	const blockProps = useBlockProps();
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();

	let [ date ] = useEntityProp< string | Date >(
		'root',
		'comment',
		'date',
		commentId
	);
	const [ siteFormat = getDateSettings().formats.date ] =
		useEntityProp< string >( 'root', 'site', 'date_format' );

	const inspectorControls = (
		<InspectorControls>
			<ToolsPanel
				label={ __( 'Settings' ) }
				resetAll={ () => {
					setAttributes( {
						format: undefined,
						isLink: true,
					} );
				} }
				dropdownMenuProps={ dropdownMenuProps }
			>
				<ToolsPanelItem
					label={ __( 'Date format' ) }
					hasValue={ () => format !== undefined }
					onDeselect={ () => setAttributes( { format: undefined } ) }
					isShownByDefault
				>
					<DateFormatPicker
						format={ format }
						defaultFormat={ siteFormat }
						onChange={ ( nextFormat ) =>
							setAttributes( { format: nextFormat! } )
						}
					/>
				</ToolsPanelItem>

				<ToolsPanelItem
					label={ __( 'Link to comment' ) }
					hasValue={ () => ! isLink }
					onDeselect={ () => setAttributes( { isLink: true } ) }
					isShownByDefault
				>
					<ToggleControl
						label={ __( 'Link to comment' ) }
						onChange={ () => setAttributes( { isLink: ! isLink } ) }
						checked={ isLink }
					/>
				</ToolsPanelItem>
			</ToolsPanel>
		</InspectorControls>
	);

	if ( ! commentId || ! date ) {
		date = _x( 'Comment Date', 'block title' );
	}

	let commentDate =
		date instanceof Date ? (
			<time dateTime={ dateI18n( 'c', date ) }>
				{ format === 'human-diff'
					? humanTimeDiff( date )
					: dateI18n( format || siteFormat, date ) }
			</time>
		) : (
			<time>{ date }</time>
		);

	if ( isLink ) {
		commentDate = (
			<a
				href="#comment-date-pseudo-link"
				onClick={ ( event ) => event.preventDefault() }
			>
				{ commentDate }
			</a>
		);
	}

	return (
		<>
			{ inspectorControls }
			<div { ...blockProps }>{ commentDate }</div>
		</>
	);
}

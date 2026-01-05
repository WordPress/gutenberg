/**
 * WordPress dependencies
 */
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
	ToggleControl,
} from '@wordpress/components';
import { __, _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useToolsPanelDropdownMenuProps } from '../utils/hooks';

/**
 * Renders the `core/comment-date` block on the editor.
 *
 * @param {Object} props                   React props.
 * @param {Object} props.setAttributes     Callback for updating block attributes.
 * @param {Object} props.attributes        Block attributes.
 * @param {string} props.attributes.format Format of the date.
 * @param {string} props.attributes.isLink Whether the author name should be linked.
 * @param {Object} props.context           Inherited context.
 * @param {string} props.context.commentId The comment ID.
 *
 * @return {JSX.Element} React element.
 */
export default function Edit( {
	attributes: { format, isLink },
	context: { commentId },
	setAttributes,
} ) {
	const blockProps = useBlockProps();
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();

	let [ date ] = useEntityProp( 'root', 'comment', 'date', commentId );
	const [ siteFormat = getDateSettings().formats.date ] = useEntityProp(
		'root',
		'site',
		'date_format'
	);

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
							setAttributes( { format: nextFormat } )
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

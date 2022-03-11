/**
 * WordPress dependencies
 */
import { useEntityProp } from '@wordpress/core-data';
import {
	dateI18n,
	__experimentalGetSettings as getDateSettings,
} from '@wordpress/date';
import {
	InspectorControls,
	useBlockProps,
	DateFormatPicker,
} from '@wordpress/block-editor';
import { PanelBody, ToggleControl } from '@wordpress/components';
import { __, _x } from '@wordpress/i18n';

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
	const [ date ] = useEntityProp( 'root', 'comment', 'date', commentId );
	const [ siteFormat = getDateSettings().formats.date ] = useEntityProp(
		'root',
		'site',
		'date_format'
	);

	const inspectorControls = (
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
					label={ __( 'Link to comment' ) }
					onChange={ () => setAttributes( { isLink: ! isLink } ) }
					checked={ isLink }
				/>
			</PanelBody>
		</InspectorControls>
	);

	if ( ! commentId || ! date ) {
		return (
			<>
				{ inspectorControls }
				<div { ...blockProps }>
					<p>{ _x( 'Comment Date', 'block title' ) }</p>
				</div>
			</>
		);
	}

	let commentDate = (
		<time dateTime={ dateI18n( 'c', date ) }>
			{ dateI18n( format || siteFormat, date ) }
		</time>
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

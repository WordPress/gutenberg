/**
 * WordPress dependencies
 */
import { useEntityProp } from '@wordpress/core-data';
import { __experimentalGetSettings, dateI18n } from '@wordpress/date';
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import {
	PanelBody,
	CustomSelectControl,
	ToggleControl,
} from '@wordpress/components';
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
	const [ siteDateFormat ] = useEntityProp( 'root', 'site', 'date_format' );

	const settings = __experimentalGetSettings();
	const formatOptions = Object.values( settings.formats ).map(
		( formatOption ) => ( {
			key: formatOption,
			name: dateI18n( formatOption, date || new Date() ),
		} )
	);
	const resolvedFormat = format || siteDateFormat || settings.formats.date;

	const inspectorControls = (
		<InspectorControls>
			<PanelBody title={ __( 'Format settings' ) }>
				<CustomSelectControl
					hideLabelFromVision
					label={ __( 'Date Format' ) }
					options={ formatOptions }
					onChange={ ( { selectedItem } ) =>
						setAttributes( {
							format: selectedItem.key,
						} )
					}
					value={ formatOptions.find(
						( option ) => option.key === resolvedFormat
					) }
				/>
			</PanelBody>
			<PanelBody title={ __( 'Link settings' ) }>
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
			{ dateI18n( resolvedFormat, date ) }
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

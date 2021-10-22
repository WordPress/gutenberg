/**
 * WordPress dependencies
 */
import { useEntityProp } from '@wordpress/core-data';
import { dateI18n } from '@wordpress/date';
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { PanelBody, ToggleControl } from '@wordpress/components';
import { __, _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import DateFormatControls from '../post-date/date-format-controls';
import { useDateFormat } from '../post-date/util';

/**
 * Renders the `core/post-comment-date` block on the editor.
 *
 * @param {Object} props                      React props.
 * @param {Object} props.setAttributes        Callback for updating block attributes.
 * @param {Object} props.attributes           Block attributes.
 * @param {string} props.attributes.className Block class name.
 * @param {string} props.attributes.format    Format of the date.
 * @param {string} props.attributes.isLink    Whether the author name should be linked.
 * @param {Object} props.context              Inherited context.
 * @param {string} props.context.commentId    The comment ID.
 *
 * @return {JSX.Element} React element.
 */
export default function Edit( {
	attributes: { className, format, isLink },
	context: { commentId },
	setAttributes,
} ) {
	const blockProps = useBlockProps( { className } );
	const [ date ] = useEntityProp( 'root', 'comment', 'date', commentId );
	const resolvedFormat = useDateFormat( format );

	const inspectorControls = (
		<InspectorControls>
			<PanelBody title={ __( 'Format settings' ) }>
				<DateFormatControls
					format={ format }
					date={ date }
					setFormat={ ( newFormat ) =>
						setAttributes( { format: newFormat } )
					}
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
					<p>{ _x( 'Post Comment Date', 'block title' ) }</p>
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

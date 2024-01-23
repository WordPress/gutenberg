/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	AlignmentControl,
	BlockControls,
	useBlockProps,
} from '@wordpress/block-editor';

/**
 * Renders the `core/comment-reply-link` block on the editor.
 *
 * @param {Object} props                      React props.
 * @param {Object} props.setAttributes        Callback for updating block attributes.
 * @param {Object} props.attributes           Block attributes.
 * @param {string} props.attributes.textAlign The `textAlign` attribute.
 *
 * @return {JSX.Element} React element.
 */
function Edit( { setAttributes, attributes: { textAlign } } ) {
	const blockProps = useBlockProps( {
		className: classnames( {
			[ `has-text-align-${ textAlign }` ]: textAlign,
		} ),
	} );

	const blockControls = (
		<BlockControls group="block">
			<AlignmentControl
				value={ textAlign }
				onChange={ ( newAlign ) =>
					setAttributes( { textAlign: newAlign } )
				}
			/>
		</BlockControls>
	);

	return (
		<>
			{ blockControls }
			<div { ...blockProps }>
				<a
					href="#comment-reply-pseudo-link"
					onClick={ ( event ) => event.preventDefault() }
				>
					{ __( 'Reply' ) }
				</a>
			</div>
		</>
	);
}

export default Edit;

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useBlockProps } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import useDeprecatedTextAlign from '../utils/deprecated-text-align-attributes';

function Edit( props ) {
	useDeprecatedTextAlign( props );
	const blockProps = useBlockProps();

	return (
		<>
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

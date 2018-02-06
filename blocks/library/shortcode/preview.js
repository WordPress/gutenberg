/**
 * WordPress dependencies
 */
import { withAPIData, Spinner, SandBox } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

function ShortcodePreview( { response, setFocus } ) {
	if ( response.isLoading || ! response.data ) {
		return (
			<div key="loading" className="wp-block-embed is-loading">
				<Spinner />
				<p>{ __( 'Loading...' ) }</p>
			</div>
		);
	}

	return (
		<figure className="wp-block-embed" key="embed">
			<SandBox
				html={ response.data.html }
				title="Preview"
				type={ response.data.type }
				js={ response.data.js }
				style={ response.data.style }
				onFocus={ setFocus }
			/>
		</figure>
	);
}

const applyWithAPIData = withAPIData( ( props ) => {
	const { shortcode, postId } = props;
	return {
		response: `/gutenberg/v1/shortcodes?shortcode=${ shortcode }&postId=${ postId }`,
	};
} );

export default applyWithAPIData( ShortcodePreview );

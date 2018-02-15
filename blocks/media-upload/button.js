/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { Button, Tooltip } from '@wordpress/components';
import { deprecated } from '@wordpress/utils';

/**
 * Internal dependencies
 */
import MediaUpload from './';

class MediaUploadButton extends Component {
	componentDidMount() {
		deprecated( 'MediaUploadButton', '2.4', 'wp.blocks.MediaUpload', 'Gutenberg' );
	}

	render() {
		const { children, buttonProps, tooltip } = this.props;

		return (
			<MediaUpload
				render={ ( { open } ) => {
					let element = (
						<Button onClick={ open } { ...buttonProps }>
							{ children }
						</Button>
					);

					if ( tooltip ) {
						element = <Tooltip text={ tooltip }>{ element }</Tooltip>;
					}

					return element;
				} }
			/>
		);
	}
}

export default MediaUploadButton;

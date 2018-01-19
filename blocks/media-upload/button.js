/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { Button, Tooltip } from '@wordpress/components';

/**
 * Internal dependencies
 */
import MediaUpload from './';

class MediaUploadButton extends Component {
	componentDidMount() {
		// eslint-disable-next-line no-console
		console.warn( 'MediaUploadButton is deprecated use wp.blocks.MediaUpload instead' );
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

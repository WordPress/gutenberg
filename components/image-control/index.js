/**
 * Internal dependencies
 */
import { __ } from '@wordpress/i18n';
import BaseControl from '../base-control';
import MediaUpload from '../../blocks/media-upload';
import Button from '../button';
import withInstanceId from '../higher-order/with-instance-id';
import './style.scss';

function ImageControl( { label, value, help, instanceId, onSelect, buttonRender = null, ...props } ) {
	const id = `inspector-media-upload-control-${ instanceId }`;
	if ( ! buttonRender ) {
		buttonRender = ( { open } ) => (
			<Button className={ value ? 'image-button' : 'button button-large' } onClick={ open }>
				{ ! value ? __( 'Add from Media Library' ) : <img src={ value } alt={ __( 'Preview' ) } title={ __( 'Edit image' ) } /> }
			</Button>
		);
	}

	return (
		<BaseControl label={ label } id={ id } help={ help }>
			<MediaUpload
				className="blocks-media-upload-control__input"
				id={ id }
				onSelect={ onSelect }
				type="image"
				value={ value }
				render={ buttonRender }
				aria-describedby={ !! help ? id + '__help' : undefined }
				{ ...props }
			/>
		</BaseControl>
	);
}

export default withInstanceId( ImageControl );

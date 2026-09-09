import { useEffect } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
import { unlock } from '../../lock-unlock';
import { store as uploadStore } from '../../store';

/**
 * Writes the given settings into the upload store.
 *
 * The store is a single instance living in the default data registry, so
 * operations registered against it are visible to every editor on the page.
 *
 * @param props
 * @param props.children Children.
 * @param props.settings Upload settings.
 */
function MediaUploadProvider( props: any ) {
	const { children, settings } = props;
	const { updateSettings } = unlock( useDispatch( uploadStore ) );

	useEffect( () => {
		updateSettings( settings );
	}, [ settings, updateSettings ] );

	return <>{ children }</>;
}

export default MediaUploadProvider;

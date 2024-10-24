/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import withRegistryProvider from './with-registry-provider';
import { unlock } from '../../lock-unlock';
import { store as uploadStore } from '../../store';

const MediaUploadProvider = withRegistryProvider( ( props: any ) => {
	const { children, settings } = props;
	const { updateSettings } = unlock( useDispatch( uploadStore ) );

	useEffect( () => {
		updateSettings( settings );
	}, [ settings, updateSettings ] );

	return <>{ children }</>;
} );

export default MediaUploadProvider;

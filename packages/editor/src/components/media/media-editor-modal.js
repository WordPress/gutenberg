/**
 * WordPress dependencies
 */
import { useSettings } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { privateApis as mediaEditorPrivateApis } from '@wordpress/media-editor';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import usePostFields from '../post-fields';

const { MediaEditorModal, store: mediaEditorStore } = unlock(
	mediaEditorPrivateApis
);

function ratioToNumber( ratio ) {
	if ( ratio === undefined || ratio === null ) {
		return NaN;
	}
	const [ a, b, ...rest ] = String( ratio ).split( '/' ).map( Number );
	if (
		a <= 0 ||
		b <= 0 ||
		Number.isNaN( a ) ||
		Number.isNaN( b ) ||
		rest.length
	) {
		return NaN;
	}
	return b ? a / b : a;
}

function aspectRatioPresetFromSettings( { name, ratio } = {} ) {
	const value = ratioToNumber( ratio );
	if ( ! name || ! Number.isFinite( value ) || value <= 0 ) {
		return null;
	}
	return {
		label: name,
		value,
	};
}

/**
 * Mounts the MediaEditorModal alongside existing editor modals.
 *
 * Bridges `@wordpress/editor`'s `usePostFields('attachment')` hook
 * into the modal, since `@wordpress/media-editor` cannot depend on
 * `@wordpress/editor`.
 *
 * Defers the attachment fields and settings reads until the modal
 * actually opens, so editor startup doesn't pay for them on every
 * page load.
 *
 * @return {Element|null} The MediaEditorModal component wired with attachment fields, or null when closed.
 */
export default function MediaEditorModalMount() {
	const isOpen = useSelect(
		( select ) => select( mediaEditorStore ).isOpen(),
		[]
	);
	if ( ! isOpen ) {
		return null;
	}
	return <MediaEditorModalContent />;
}

function MediaEditorModalContent() {
	const fields = usePostFields( { postType: 'attachment' } );
	const [ defaultRatios, themeRatios, showDefaultRatios ] = useSettings(
		'dimensions.aspectRatios.default',
		'dimensions.aspectRatios.theme',
		'dimensions.defaultAspectRatios'
	);
	const aspectRatioPresets = useMemo( () => {
		const hasAspectRatioSettings =
			Array.isArray( defaultRatios ) ||
			Array.isArray( themeRatios ) ||
			typeof showDefaultRatios === 'boolean';

		if ( ! hasAspectRatioSettings ) {
			return undefined;
		}

		const candidateRatios = [
			...( showDefaultRatios && Array.isArray( defaultRatios )
				? defaultRatios
				: [] ),
			...( Array.isArray( themeRatios ) ? themeRatios : [] ),
		];
		const presets = candidateRatios
			.map( aspectRatioPresetFromSettings )
			.filter( Boolean );

		// Passing `undefined` lets the media editor use its fallback presets.
		// Passing `[]` explicitly removes fixed presets when defaults are off.
		if ( presets.length || showDefaultRatios === false ) {
			return presets;
		}

		return undefined;
	}, [ defaultRatios, themeRatios, showDefaultRatios ] );

	return (
		<MediaEditorModal
			fields={ fields }
			aspectRatioPresets={ aspectRatioPresets }
		/>
	);
}

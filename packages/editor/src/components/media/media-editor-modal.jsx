import { useSettings } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { useFields } from '@wordpress/fields-loader';
import { privateApis as mediaEditorPrivateApis } from '@wordpress/media-editor';
import { useViewConfig } from '@wordpress/views';
import { unlock } from '../../lock-unlock';

const { MediaEditorModal, store: mediaEditorStore } = unlock(
	mediaEditorPrivateApis
);

/**
 * The modal only renders a form, so it requests the `form` of the entity view
 * configuration alone.
 */
const VIEW_CONFIG_FIELDS = [ 'form' ];

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
 * Reads the attachment fields with `useFields` and the form they are laid
 * out with from the entity view configuration, and passes both into the
 * modal, which takes them as props.
 *
 * Defers the attachment fields, form and settings reads until the modal
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
	const { fields } = useFields( {
		kind: 'postType',
		name: 'attachment',
	} );
	// Until the form resolves, and if it fails to, the modal lays the fields
	// out with its own default form.
	const { form } = useViewConfig( {
		kind: 'postType',
		name: 'attachment',
		fields: VIEW_CONFIG_FIELDS,
	} );
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
			form={ form }
			aspectRatioPresets={ aspectRatioPresets }
		/>
	);
}

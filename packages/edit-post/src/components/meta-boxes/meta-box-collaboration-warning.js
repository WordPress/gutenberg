/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { store as coreStore } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

/**
 * Known WordPress core form field names that are not post meta keys.
 * These should be excluded when inspecting meta box form fields.
 */
const KNOWN_CORE_FIELDS = new Set( [
	'post_ID',
	'post_type',
	'_wpnonce',
	'originalaction',
	'action',
	'referredby',
	'_wp_http_referer',
	'original_post_status',
	'save',
	'publish',
	'post_status',
	'hidden_post_status',
	'post_author',
	'comment_status',
	'ping_status',
	'sticky',
	'post_format',
	'tax_input',
	'newtag',
	'post_category',
	'newcategory',
	'newcategory_parent',
] );

/**
 * Extracts likely meta key names from a form field's `name` attribute.
 * Handles array notation like `meta[key_name]`.
 *
 * @param {string} fieldName The form field name attribute value.
 * @return {string} The extracted meta key name.
 */
function extractMetaKey( fieldName ) {
	// Handle array notation: "meta[key_name]" → "key_name"
	const match = fieldName.match( /^meta\[([^\]]+)\]/ );
	if ( match ) {
		return match[ 1 ];
	}
	// Handle array fields like "tax_input[post_tag][]" → "tax_input"
	const bracketIndex = fieldName.indexOf( '[' );
	if ( bracketIndex !== -1 ) {
		return fieldName.substring( 0, bracketIndex );
	}
	return fieldName;
}

/**
 * Checks whether a meta box contains form fields that reference
 * post meta keys not registered with the REST API.
 *
 * @param {HTMLElement} metaBoxElement The meta box DOM element.
 * @param {Object}      registeredMeta Object whose keys are REST-registered meta key names.
 * @return {boolean} True if the meta box has non-REST-registered fields.
 */
function hasNonRestFields( metaBoxElement, registeredMeta ) {
	const formFields = metaBoxElement.querySelectorAll(
		'input[name], select[name], textarea[name]'
	);

	const registeredKeys = new Set( Object.keys( registeredMeta ) );

	for ( const field of formFields ) {
		const name = field.getAttribute( 'name' );
		if ( ! name ) {
			continue;
		}

		// Skip submit buttons and button-type inputs.
		const type = ( field.getAttribute( 'type' ) || '' ).toLowerCase();
		if ( type === 'submit' || type === 'button' ) {
			continue;
		}

		// Skip hidden nonce fields (names starting with _).
		if ( name.startsWith( '_' ) ) {
			continue;
		}

		const metaKey = extractMetaKey( name );

		// Skip known WordPress core fields.
		if ( KNOWN_CORE_FIELDS.has( metaKey ) ) {
			continue;
		}

		// If the field's meta key is not REST-registered, flag it.
		if ( ! registeredKeys.has( metaKey ) ) {
			return true;
		}
	}

	return false;
}

/**
 * Injects or removes a collaboration warning element in a meta box's DOM.
 *
 * @param {HTMLElement} metaBoxElement The meta box DOM element.
 * @param {string}      id             The meta box ID.
 * @param {boolean}     shouldShow     Whether the warning should be visible.
 */
function updateWarningElement( metaBoxElement, id, shouldShow ) {
	const warningId = `meta-box-collab-warning-${ id }`;
	const existing = document.getElementById( warningId );

	if ( ! shouldShow ) {
		if ( existing ) {
			existing.remove();
		}
		return;
	}

	if ( existing ) {
		return;
	}

	const warning = document.createElement( 'div' );
	warning.id = warningId;
	warning.className = 'meta-box-collaboration-warning';
	warning.setAttribute( 'role', 'status' );
	warning.setAttribute( 'aria-live', 'polite' );

	const icon = document.createElement( 'span' );
	icon.className =
		'dashicons dashicons-warning meta-box-collaboration-warning__icon';
	icon.setAttribute( 'aria-hidden', 'true' );

	const text = document.createElement( 'span' );
	text.className = 'meta-box-collaboration-warning__text';

	const srText = document.createElement( 'span' );
	srText.className = 'screen-reader-text';
	srText.textContent = __( 'Warning:' ) + ' ';

	text.appendChild( srText );
	text.appendChild(
		document.createTextNode(
			__( 'Changes here may not sync with collaborators.' )
		)
	);

	warning.appendChild( icon );
	warning.appendChild( text );

	const postboxHeader = metaBoxElement.querySelector( '.postbox-header' );
	if ( postboxHeader ) {
		postboxHeader.insertAdjacentElement( 'afterend', warning );
	} else {
		metaBoxElement.insertAdjacentElement( 'afterbegin', warning );
	}
}

export default function MetaBoxCollaborationWarning( { id } ) {
	const { isCollaborationEnabled, registeredMeta } = useSelect(
		( select ) => {
			const { isCollaborationEnabledForCurrentPost, getCurrentPostType } =
				select( editorStore );
			const isEnabled = isCollaborationEnabledForCurrentPost();
			let meta = {};
			if ( isEnabled ) {
				const postType = getCurrentPostType();
				meta =
					unlock( select( coreStore ) ).getRegisteredPostMeta(
						postType
					) ?? {};
			}
			return {
				isCollaborationEnabled: isEnabled,
				registeredMeta: meta,
			};
		},
		[]
	);

	useEffect( () => {
		const metaBoxElement = document.getElementById( id );
		if ( ! metaBoxElement ) {
			updateWarningElement( metaBoxElement, id, false );
			return;
		}

		if ( ! isCollaborationEnabled ) {
			updateWarningElement( metaBoxElement, id, false );
			return;
		}

		// Custom Fields meta box can edit arbitrary meta — always flag.
		if ( id === 'postcustom' ) {
			updateWarningElement( metaBoxElement, id, true );
		} else {
			const shouldWarn = hasNonRestFields(
				metaBoxElement,
				registeredMeta
			);
			updateWarningElement( metaBoxElement, id, shouldWarn );
		}

		return () => {
			const warningEl = document.getElementById(
				`meta-box-collab-warning-${ id }`
			);
			if ( warningEl ) {
				warningEl.remove();
			}
		};
	}, [ id, isCollaborationEnabled, registeredMeta ] );

	return null;
}

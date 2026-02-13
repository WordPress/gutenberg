/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { store as coreStore } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';
import { applyFilters } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

/**
 * Classic editor form field names that are not post meta.
 * These are form/UI-specific fields (nonces, actions, submit buttons,
 * taxonomy creation inputs) that have no REST API equivalent.
 */
const FORM_ONLY_FIELDS = new Set( [
	'_wpnonce',
	'_wp_http_referer',
	'originalaction',
	'action',
	'referredby',
	'original_post_status',
	'hidden_post_status',
	'save',
	'publish',
	'newtag',
	'newcategory',
	'newcategory_parent',
] );

/**
 * Maps classic editor form field names to their REST API property equivalents.
 * Fields not in this map are assumed to use the same name in both contexts.
 */
const FORM_FIELD_TO_REST_PROPERTY = {
	post_ID: 'id',
	post_type: 'type',
	post_status: 'status',
	post_author: 'author',
	post_format: 'format',
	post_category: 'categories',
	tax_input: 'categories',
};

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
 * @param {string}      id             The meta box ID.
 * @param {string[]}    postFields     REST API property names from the post entity record.
 * @return {boolean} True if the meta box has non-REST-registered fields.
 */
function hasNonRestFields( metaBoxElement, registeredMeta, id, postFields ) {
	const formFields = metaBoxElement.querySelectorAll(
		'input[name], select[name], textarea[name]'
	);

	const extraIgnoredFields = applyFilters(
		'editPost.metaBoxCollaborationWarning.ignoredFields',
		[],
		id
	);

	// Build the set of fields to ignore: form-only fields, REST property
	// names from the entity record, form-field aliases that map to REST
	// properties, and any extra fields added via filter.
	const ignoredFields = new Set( [
		...FORM_ONLY_FIELDS,
		...postFields,
		...Object.keys( FORM_FIELD_TO_REST_PROPERTY ),
		...extraIgnoredFields,
	] );

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

		// Skip known core fields, REST properties, and extra ignored fields.
		if ( ignoredFields.has( metaKey ) ) {
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
	const { isCollaborationEnabled, registeredMeta, postFields } = useSelect(
		( select ) => {
			const {
				isCollaborationEnabledForCurrentPost,
				getCurrentPostType,
				getCurrentPostId,
			} = select( editorStore );
			const isEnabled = isCollaborationEnabledForCurrentPost();
			let meta = {};
			let fields = [];
			if ( isEnabled ) {
				const postType = getCurrentPostType();
				const postId = getCurrentPostId();
				meta =
					unlock( select( coreStore ) ).getRegisteredPostMeta(
						postType
					) ?? {};
				const record = select( coreStore ).getEditedEntityRecord(
					'postType',
					postType,
					postId
				);
				fields = record ? Object.keys( record ) : [];
			}
			return {
				isCollaborationEnabled: isEnabled,
				registeredMeta: meta,
				postFields: fields,
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
		let shouldWarn;
		if ( id === 'postcustom' ) {
			shouldWarn = true;
		} else {
			shouldWarn = hasNonRestFields(
				metaBoxElement,
				registeredMeta,
				id,
				postFields
			);
		}

		shouldWarn = applyFilters(
			'editPost.metaBoxCollaborationWarning.shouldShow',
			shouldWarn,
			id
		);

		updateWarningElement( metaBoxElement, id, shouldWarn );

		return () => {
			const warningEl = document.getElementById(
				`meta-box-collab-warning-${ id }`
			);
			if ( warningEl ) {
				warningEl.remove();
			}
		};
	}, [ id, isCollaborationEnabled, registeredMeta, postFields ] );

	return null;
}

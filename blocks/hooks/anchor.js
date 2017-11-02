/**
 * External dependencies
 */
import { assign, get } from 'lodash';

/**
 * WordPress dependencies
 */
import { cloneElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { source } from '../api';
import InspectorControls from '../inspector-controls';

/**
 * Regular expression matching invalid anchor characters for replacement.
 *
 * @type {RegExp}
 */
const ANCHOR_REGEX = /[\s#]/g;

export default function anchor( settings ) {
	if ( ! get( settings.supports, 'anchor' ) ) {
		return settings;
	}

	// Extend attributes with anchor determined by ID on the first node, using
	// assign to gracefully handle if original attributes are undefined.
	assign( settings.attributes, {
		anchor: {
			type: 'string',
			source: source.attr( '*', 'id' ),
		},
	} );

	// Override the default edit UI to include a new block inspector control
	// for assigning the anchor ID
	const { edit: Edit } = settings;
	settings.edit = function( props ) {
		return [
			<Edit key="edit" { ...props } />,
			props.focus && (
				<InspectorControls key="inspector">
					<InspectorControls.TextControl
						label={ __( 'HTML Anchor' ) }
						help={ __( 'Anchors lets you link directly to a section on a page.' ) }
						value={ props.attributes.anchor || '' }
						onChange={ ( nextValue ) => {
							nextValue = nextValue.replace( ANCHOR_REGEX, '-' );

							props.setAttributes( {
								anchor: nextValue,
							} );
						} } />
				</InspectorControls>
			),
		];
	};

	// Override the default block serialization to clone the returned element,
	// injecting the attribute ID.
	const { save } = settings;
	settings.save = function( { attributes } ) {
		const { anchor: id } = attributes;

		let result = save( ...arguments );
		if ( 'string' !== typeof result && id ) {
			result = cloneElement( result, { id } );
		}

		return result;
	};

	return settings;
}

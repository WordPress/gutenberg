/**
 * External dependencies
 */
import TestRenderer, { act } from 'react-test-renderer';

/**
 * WordPress dependencies
 */
import { create } from '@wordpress/rich-text';

/**
 * Internal dependencies
 */
import InlineLinkUI, { URLPopoverAtLink } from '../inline';

describe( 'InlineLinkUI', () => {
	const defaultProps = {
		value: create( { text: '' } ),
		activeAttributes: {},
	};

	// TODO: At the time of writing, JSDOM has just implemented Selection APIs,
	// but they are not yet published in a publicly-available release. This
	// `window.getSelection` assignment should be non-harmful but also redundant
	// once this becomes available. In other words, once the next JSDOM feature
	// release is published, this lifecycle code should be able to be removed.
	//
	// See: https://github.com/jsdom/jsdom/pull/2719
	let originalWindowGetSelection;
	beforeAll( () => {
		originalWindowGetSelection = window.getSelection;
		window.getSelection = () => ( { rangeCount: 0 } );
	} );

	afterAll( () => {
		window.getSelection = originalWindowGetSelection;
	} );

	it( 'should set "Opens in New Tab" toggle to unchecked by default', () => {
		let renderer;
		act( () => {
			renderer = TestRenderer.create( <InlineLinkUI { ...defaultProps } /> );
		} );

		const openInNewTabToggle = renderer.root.findByType( URLPopoverAtLink ).props.renderSettings();
		expect( openInNewTabToggle.props.checked ).toBe( false );
	} );

	it( 'should set "Opens in New Tab" toggle to checked if props.activeAttributes.target is _blank', () => {
		let renderer;
		act( () => {
			renderer = TestRenderer.create( <InlineLinkUI { ...defaultProps } /> );
		} );

		act( () => {
			renderer.update(
				<InlineLinkUI
					{ ...defaultProps }
					activeAttributes={ {
						url: 'http://www.google.com',
						target: '_blank',
					} }
				/>
			);
		} );

		const openInNewTabToggle = renderer.root.findByType( URLPopoverAtLink ).props.renderSettings();
		expect( openInNewTabToggle.props.checked ).toBe( true );
	} );
} );

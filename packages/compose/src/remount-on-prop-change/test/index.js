/**
 * External dependencies
 */
import TestRenderer from 'react-test-renderer';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import remountOnPropChange from '../';

describe( 'remountOnPropChange', () => {
	let count = 0;
	class MountCounter extends Component {
		constructor() {
			super( ...arguments );
			this.state = {
				count: 0,
			};
		}

		componentDidMount() {
			count++;
			this.setState( {
				count: count,
			} );
		}

		render() {
			return this.state.count;
		}
	}

	beforeEach( () => {
		count = 0;
	} );

	it( 'Should not remount the inner component if the prop value doesn’t change', () => {
		const Wrapped = remountOnPropChange( 'monitor' )( MountCounter );
		const testRenderer = TestRenderer.create(
			<Wrapped monitor="unchanged" other="1" />
		);

		expect( testRenderer.toJSON() ).toBe( '1' );

		// Changing an unmonitored prop
		testRenderer.update(
			<Wrapped monitor="unchanged" other="2" />
		);
		expect( testRenderer.toJSON() ).toBe( '1' );
	} );

	it( 'Should remount the inner component if the prop value changes', () => {
		const Wrapped = remountOnPropChange( 'monitor' )( MountCounter );
		const testRenderer = TestRenderer.create(
			<Wrapped monitor="initial" />
		);

		expect( testRenderer.toJSON() ).toBe( '1' );

		// Changing an the monitored prop remounts the component
		testRenderer.update(
			<Wrapped monitor="updated" />
		);
		expect( testRenderer.toJSON() ).toBe( '2' );
	} );
} );

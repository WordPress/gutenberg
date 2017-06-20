/**
 * External dependencies
 */
import { expect } from 'chai';
import { shallow } from 'enzyme';
import sinon from 'sinon';

/**
 * Internal dependencies
 */
import { SavedState } from '../';

describe( 'SavedState', () => {
	it( 'should display saving while save in progress, even if not saveable', () => {
		const wrapper = shallow(
			<SavedState
				isNew
				isDirty={ false }
				isSaving={ true }
				isSaveable={ false } />
		);

		expect( wrapper.text() ).to.equal( 'Saving' );
	} );

	it( 'returns null if the post is not saveable', () => {
		const wrapper = shallow(
			<SavedState
				isNew
				isDirty={ false }
				isSaving={ false }
				isSaveable={ false } />
		);

		expect( wrapper.type() ).to.be.null();
	} );

	it( 'should return Saved text if not new and not dirty', () => {
		const wrapper = shallow(
			<SavedState
				isNew={ false }
				isDirty={ false }
				isSaving={ false }
				isSaveable={ true } />
		);

		expect( wrapper.childAt( 0 ).name() ).to.equal( 'Dashicon' );
		expect( wrapper.childAt( 1 ).text() ).to.equal( 'Saved' );
	} );

	it( 'should return Save button if edits to be saved', () => {
		const statusSpy = sinon.spy();
		const saveSpy = sinon.spy();
		const wrapper = shallow(
			<SavedState
				isNew={ false }
				isDirty={ true }
				isSaving={ false }
				isSaveable={ true }
				onStatusChange={ statusSpy }
				onSave={ saveSpy } />
		);

		expect( wrapper.name() ).to.equal( 'Button' );
		expect( wrapper.childAt( 0 ).text() ).to.equal( 'Save' );
		wrapper.simulate( 'click' );
		expect( statusSpy ).to.have.been.calledWith( 'draft' );
		expect( saveSpy ).to.have.been.called();
	} );
} );

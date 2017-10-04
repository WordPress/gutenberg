/**
 * External dependencies
 */
import { shallow } from 'enzyme';
import { merge } from 'lodash';

/**
 * Internal dependencies
 */
import { PublishButton } from '../';

describe( 'PublishButton', () => {
	const user = {
		data: {
			id: 1,
			capabilities: {
				publish_posts: true,
			},
		},
	};

	const contributor = merge( {}, user, {
		data: {
			capabilities: {
				publish_posts: false,
			},
		},
	} );

	describe( 'disabled', () => {
		it( 'should be disabled if current user is unknown', () => {
			const wrapper = shallow(
				<PublishButton user={ {} } />
			);

			expect( wrapper.prop( 'disabled' ) ).toBe( true );
		} );

		it( 'should be disabled if post is currently saving', () => {
			const wrapper = shallow(
				<PublishButton user={ user } isSaving />
			);

			expect( wrapper.prop( 'disabled' ) ).toBe( true );
		} );

		it( 'should be disabled if post is not publishable', () => {
			const wrapper = shallow(
				<PublishButton user={ user } isPublishable={ false } />
			);

			expect( wrapper.prop( 'disabled' ) ).toBe( true );
		} );

		it( 'should be disabled if post is not saveable', () => {
			const wrapper = shallow(
				<PublishButton user={ user } isSaveable={ false } />
			);

			expect( wrapper.prop( 'disabled' ) ).toBe( true );
		} );

		it( 'should be enabled otherwise', () => {
			const wrapper = shallow(
				<PublishButton user={ user } isPublishable isSaveable />
			);

			expect( wrapper.prop( 'disabled' ) ).toBe( false );
		} );
	} );

	describe( 'button text', () => {
		it( 'should show publish if user unknown', () => {
			const wrapper = shallow(
				<PublishButton user={ {} } />
			);

			expect( wrapper.children().text() ).toBe( 'Publish' );
		} );

		it( 'should show submit for review for contributor', () => {
			const wrapper = shallow(
				<PublishButton user={ contributor } />
			);

			expect( wrapper.children().text() ).toBe( 'Submit for Review' );
		} );

		it( 'should show update for already published', () => {
			const wrapper = shallow(
				<PublishButton user={ user } isPublished />
			);

			expect( wrapper.children().text() ).toBe( 'Update' );
		} );

		it( 'should show schedule for scheduled', () => {
			const wrapper = shallow(
				<PublishButton user={ user } isBeingScheduled />
			);

			expect( wrapper.children().text() ).toBe( 'Schedule' );
		} );

		it( 'should show publish otherwise', () => {
			const wrapper = shallow(
				<PublishButton user={ user } />
			);

			expect( wrapper.children().text() ).toBe( 'Publish' );
		} );
	} );

	describe( 'publish status', () => {
		it( 'should be pending for contributor', () => {
			const onStatusChange = jest.fn();
			const onSave = jest.fn();
			const wrapper = shallow(
				<PublishButton
					user={ contributor }
					onStatusChange={ onStatusChange }
					onSave={ onSave } />
			);

			wrapper.simulate( 'click' );

			expect( onStatusChange ).toHaveBeenCalledWith( 'pending' );
		} );

		it( 'should be future for scheduled post', () => {
			const onStatusChange = jest.fn();
			const onSave = jest.fn();
			const wrapper = shallow(
				<PublishButton
					user={ user }
					onStatusChange={ onStatusChange }
					onSave={ onSave }
					isBeingScheduled />
			);

			wrapper.simulate( 'click' );

			expect( onStatusChange ).toHaveBeenCalledWith( 'future' );
		} );

		it( 'should be private for private visibility', () => {
			const onStatusChange = jest.fn();
			const onSave = jest.fn();
			const wrapper = shallow(
				<PublishButton
					user={ user }
					onStatusChange={ onStatusChange }
					onSave={ onSave }
					visibility="private" />
			);

			wrapper.simulate( 'click' );

			expect( onStatusChange ).toHaveBeenCalledWith( 'private' );
		} );

		it( 'should be publish otherwise', () => {
			const onStatusChange = jest.fn();
			const onSave = jest.fn();
			const wrapper = shallow(
				<PublishButton
					user={ user }
					onStatusChange={ onStatusChange }
					onSave={ onSave } />
			);

			wrapper.simulate( 'click' );

			expect( onStatusChange ).toHaveBeenCalledWith( 'publish' );
		} );
	} );

	describe( 'click', () => {
		it( 'should save with status', () => {
			const onStatusChange = jest.fn();
			const onSave = jest.fn();
			const wrapper = shallow(
				<PublishButton
					user={ user }
					onStatusChange={ onStatusChange }
					onSave={ onSave } />
			);

			wrapper.simulate( 'click' );

			expect( onStatusChange ).toHaveBeenCalledWith( 'publish' );
			expect( onSave ).toHaveBeenCalled();
		} );
	} );

	it( 'should have save modifier class', () => {
		const wrapper = shallow(
			<PublishButton user={ user } isSaving />
		);

		expect( wrapper.hasClass( 'is-saving' ) ).toBe( true );
	} );
} );

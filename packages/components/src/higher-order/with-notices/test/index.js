/**
 * External dependencies
 */
import {
	act,
	render,
	fireEvent,
	waitForElementToBeRemoved,
	within,
} from '@testing-library/react';

/**
 * WordPress dependencies
 */
import {
	forwardRef,
	useEffect,
	useImperativeHandle,
	useRef,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import withNotices from '..';

// Implementation detail of Notice component used to query the dismissal button.
const stockDismissText = 'Dismiss this notice';

function noticesFrom( list ) {
	return list.map( ( item ) => ( { id: item, content: item } ) );
}

function isComponentLike( object ) {
	return typeof object === 'function';
}

function isForwardRefLike( { render: renderMethod } ) {
	return typeof renderMethod === 'function';
}

const content = 'Base content';

const BaseComponent = ( { noticeOperations, noticeUI, notifications } ) => {
	useEffect( () => {
		if ( notifications ) {
			notifications.forEach( ( item ) =>
				noticeOperations.createNotice( item )
			);
		}
	}, [] );
	return (
		<div>
			{ noticeUI }
			{ content }
		</div>
	);
};

const TestComponent = withNotices( BaseComponent );

const TestNoticeOperations = withNotices(
	forwardRef( ( props, ref ) => {
		useImperativeHandle( ref, () => ( { ...props.noticeOperations } ) );
		return <BaseComponent { ...props } />;
	} )
);

describe( 'withNotices return type', () => {
	it( 'should be a component given a component', () => {
		expect( isComponentLike( TestComponent ) ).toBe( true );
	} );

	it( 'should be a forwardRef given a forwardRef', () => {
		expect( isForwardRefLike( TestNoticeOperations ) ).toBe( true );
	} );
} );

describe( 'withNotices operations', () => {
	let handle;
	const Handle = ( props ) => {
		handle = useRef();
		return <TestNoticeOperations { ...props } ref={ handle } />;
	};

	it( 'should create notices with createNotice', () => {
		const message = 'Aló!';
		const { container } = render( <Handle /> );
		const { getByText } = within( container );
		act( () => {
			handle.current.createNotice( { content: message } );
		} );
		expect( getByText( message ) ).not.toBeNull();
	} );

	it( 'should create notices of error status with createErrorNotice', () => {
		const message = 'can’t touch this';
		const { container } = render( <Handle /> );
		const { getByText } = within( container );
		act( () => {
			handle.current.createErrorNotice( message );
		} );
		expect( getByText( message )?.closest( '.is-error' ) ).not.toBeNull();
	} );

	it( 'should remove a notice with removeNotice', async () => {
		const notice = { id: 'so real', content: 'so why can’t I touch it?' };
		const { container } = render( <Handle /> );
		const { getByText } = within( container );
		act( () => {
			handle.current.createNotice( notice );
		} );
		expect(
			await waitForElementToBeRemoved( () => {
				const target = getByText( notice.content );
				act( () => handle.current.removeNotice( notice.id ) );
				return target;
			} ).then( () => true )
		).toBe( true );
	} );

	it( 'should remove all notices with removeAllNotices', async () => {
		const messages = [ 'Aló!', 'hu dis?', 'Otis' ];
		const notices = noticesFrom( messages );
		const { container } = render( <Handle notifications={ notices } /> );
		const { getByText } = within( container );
		expect(
			await waitForElementToBeRemoved( () => {
				const targets = notices.map( ( notice ) =>
					getByText( notice.content )
				);
				act( () => handle.current.removeAllNotices() );
				return targets;
			} ).then( () => true )
		).toBe( true );
	} );
} );

describe( 'withNotices rendering', () => {
	it( 'should display the original component given no notices', () => {
		const { container } = render( <TestComponent /> );
		expect( container.innerHTML ).toBe( `<div>${ content }</div>` );
	} );

	it( 'should display notices with functioning dismissal triggers', async () => {
		const messages = [ 'Aló!', 'hu dis?', 'Otis' ];
		const notices = noticesFrom( messages );
		const { container, getAllByLabelText } = render(
			<TestComponent notifications={ notices } />
		);
		const [ buttonRemoveFirst ] = getAllByLabelText( stockDismissText );
		const getRemovalTarget = () =>
			within( container ).getByText(
				// The last item corresponds to the first notice in the DOM.
				messages[ messages.length - 1 ]
			);
		expect(
			await waitForElementToBeRemoved( () => {
				const target = getRemovalTarget();
				// Removes the first notice in the DOM.
				fireEvent.click( buttonRemoveFirst );
				return target;
			} ).then( () => true )
		).toBe( true );
	} );
} );

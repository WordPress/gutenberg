/**
 * External dependencies
 */
import initStoryshots, {
	snapshotWithOptions,
} from '@storybook/addon-storyshots';
import React from 'react';
import ReactDOM from 'react-dom';
import path from 'path';

initStoryshots( {
	configPath: path.resolve( __dirname, '../' ),
	test: snapshotWithOptions( ( story ) => ( {
		// We need to mock refs for some stories which use them.
		// @see https://reactjs.org/blog/2016/11/16/react-v15.4.0.html#mocking-refs-for-snapshot-testing
		// @see https://github.com/storybookjs/storybook/tree/master/addons/storyshots/storyshots-core#using-createnodemock-to-mock-refs
		createNodeMock: ( element ) => {
			const currentElement =
				element.type && document.createElement( element.type );

			if ( story.kind === 'Components/ClipboardButton' ) {
				currentElement.appendChild(
					document.createElement( 'button' )
				);
			}
			if ( story.kind === 'Components/Popover' ) {
				const parentElement = document.createElement( 'div' );
				parentElement.appendChild( currentElement );
			}
			if ( story.kind === 'Components/SlotFill' ) {
				ReactDOM.createPortal = ( children ) => {
					return React.createElement( 'div', null, children );
				};
			}

			return currentElement;
		},
	} ) ),
} );

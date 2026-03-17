/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable eslint-comments/no-unlimited-disable */
/* eslint-disable */

import _ from 'lodash';

// This module should be externalized
const { store, getContext } = await import( '@wordpress/interactivity' );

store( _.identity( 'my-namespace' ), { state: 'is great' } );

getContext();

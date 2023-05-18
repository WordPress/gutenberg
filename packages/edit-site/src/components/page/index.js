/**
 * WordPress dependencies
 */
import { __experimentalVStack as VStack } from '@wordpress/components';

/**
 * Internal dependencies
 */

import Header from './header';

export default function Page( { title, subTitle, actions, children } ) {
	return (
		<VStack spacing={ 0 } className="edit-site-page">
			<Header title={ title } subTitle={ subTitle } actions={ actions } />
			<div className="edit-site-page-content">{ children }</div>
		</VStack>
	);
}

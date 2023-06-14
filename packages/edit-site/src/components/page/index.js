/**
 * Internal dependencies
 */

import Header from './header';

export default function Page( { title, subTitle, actions, children } ) {
	return (
		<div className="edit-site-page">
			{ title && (
				<Header
					title={ title }
					subTitle={ subTitle }
					actions={ actions }
				/>
			) }
			<div className="edit-site-page-content">{ children }</div>
		</div>
	);
}

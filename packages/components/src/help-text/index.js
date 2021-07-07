/**
 * WordPress dependencies
 */
import { ExternalLink } from '@wordpress/components';

const HelpText = ( { moreLinkText, children, url } ) => {
	return (
		<div>
			{ children }
			{ url && <ExternalLink url={ url }>{ moreLinkText }</ExternalLink> }
		</div>
	);
};

export default HelpText;

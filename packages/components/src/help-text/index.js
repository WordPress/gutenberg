/**
 * WordPress dependencies
 */
import { ExternalLink } from '@wordpress/components';

const HelpText = ( { moreLinkText, children, url } ) => {
	return (
		<div>
			{ children }
			{ url && (
				<ExternalLink href={ url }>{ moreLinkText }</ExternalLink>
			) }
		</div>
	);
};

export default HelpText;

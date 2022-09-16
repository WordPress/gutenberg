/**
 * Internal dependencies
 */
import { ExternalLink } from '../external-link';

/**
 * @param {Object}                    props
 * @param {string}                    props.moreLinkText
 * @param {import('react').ReactNode} props.children
 * @param {string}                    props.url
 */
const HelpText = ( { moreLinkText, children, url } ) => {
	return (
		<div>
			{ children }
			{ url && (
				<>
					{ ' ' }
					<ExternalLink href={ url }>{ moreLinkText }</ExternalLink>
				</>
			) }
		</div>
	);
};

export default HelpText;

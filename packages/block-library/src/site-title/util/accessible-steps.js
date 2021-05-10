/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { isEmpty } from 'lodash';

const PathSeparator = () => (
	<>
		&nbsp;
		<span
			aria-label={
				// translators: accessibility text for describing steps with the > character
				__( 'and then' )
			}
		>
			{ '>' }
		</span>{ ' ' }
	</>
);

export default function AccessibleSteps( { elements, link } ) {
	if ( isEmpty( elements ) ) {
		return null;
	}

	const Wrapper = ( { children } ) =>
		isEmpty( link ) ? <>{ children }</> : <a href={ link }>{ children }</a>;

	return (
		<Wrapper>
			<b>
				{ elements.reduce( ( acc, curr ) => (
					<>
						{ acc }
						<PathSeparator />
						{ curr }
					</>
				) ) }
			</b>
		</Wrapper>
	);
}

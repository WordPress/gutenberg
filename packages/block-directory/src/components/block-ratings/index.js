/**
 * Internal dependencies
 */
import Stars from './stars';

export const BlockRatings = ( { rating } ) => (
	<span className="block-directory-block-ratings">
		<Stars rating={ rating } />
	</span>
);

export default BlockRatings;

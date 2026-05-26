/**
 * Internal dependencies
 */
import { NewsList } from './components';

const DEFAULT_PER_PAGE = 5;

type NewsAttributes = {
	perPage?: number;
};

export default function WordPressNews( {
	attributes,
}: {
	attributes?: NewsAttributes;
} ) {
	const perPage = Math.max( 1, attributes?.perPage ?? DEFAULT_PER_PAGE );

	return <NewsList perPage={ perPage } />;
}

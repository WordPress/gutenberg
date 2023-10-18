/**
 * Internal dependencies
 */
import Media from '../../components/media';

export const coreFieldTypes = {
	string: {
		render:
			( getValue ) =>
			( { item } ) =>
				getValue( { item } ),
	},
	date: {
		render:
			( getValue ) =>
			( { item } ) => <time>{ getValue( { item } ) }</time>,
	},
	image: {
		render:
			( getValue ) =>
			( { item } ) => (
				<Media id={ getValue( { item } ) } size={ [ 'thumbnail' ] } />
			),
	},
};

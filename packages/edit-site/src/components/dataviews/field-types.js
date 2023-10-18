/**
 * Internal dependencies
 */
import Media from '../../components/media';

export const coreFieldTypes = {
	string: {
		view:
			( getValue ) =>
			( { item } ) =>
				getValue( { item } ),
	},
	date: {
		view: ( { item, getValue } ) => <time>{ getValue( { item } ) }</time>,
	},
	image: {
		view:
			( getValue ) =>
			( { item } ) => (
				<Media id={ getValue( { item } ) } size={ [ 'thumbnail' ] } />
			),
	},
};

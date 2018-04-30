/**
 * External dependencies
 */
import { find } from 'lodash';

const models = [
	{ name: 'postType', kind: 'root', primaryKey: 'slug', baseUrl: '/wp/v2/types' },
];

export function getModel( kind, name ) {
	return find( models, ( model ) => model.kind === kind && model.name === name );
}

export default models;

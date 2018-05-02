/**
 * External dependencies
 */
import { find } from 'lodash';

const entities = [
	{ name: 'postType', kind: 'root', primaryKey: 'slug', baseUrl: '/wp/v2/types' },
];

export function getEntity( kind, name ) {
	return find( entities, ( entity ) => entity.kind === kind && entity.name === name );
}

export default entities;

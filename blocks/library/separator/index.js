/**
 * External dependencies
 */
import {
	Schema,
	createSchemaElement, // eslint-disable-line no-unused-vars
} from 'phs';

/**
 * Internal dependencies
 */
import './style.scss';
import { registerBlock } from '../../api';

registerBlock( 'core/separator', {
	title: wp.i18n.__( 'Separator' ),

	schema: (
		<Schema>
			<hr />
		</Schema>
	),

	icon: 'minus',

	category: 'layout',

	edit() {
		return <hr className="blocks-separator" />;
	},

	save() {
		return <hr />;
	},
} );

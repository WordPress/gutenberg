/**
 * Internal dependencies
 */
import './style.scss';
import { registerBlock } from '../../api';

registerBlock( 'core/separator', {
	title: wp.i18n.__( 'Separator' ),

	icon: 'minus',

	category: 'layout',

	edit() {
		return <hr className="blocks-separator" />;
	},

	save() {
		return <hr />;
	},
} );

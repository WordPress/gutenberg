import { addons } from 'storybook/manager-api';
import badges from './badges';
import sidebar from './sidebar';
import theme from './theme';

addons.setConfig( {
	sidebar,
	tagBadges: Object.entries( badges ).map(
		( [ key, { title, styles, tooltip } ] ) => ( {
			tags: `status-${ key }`,
			badge: {
				text: title,
				...( styles && { style: styles } ),
				tooltip,
			},
		} )
	),
	theme,
} );

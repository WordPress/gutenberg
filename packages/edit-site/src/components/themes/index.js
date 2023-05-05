/**
 * WordPress dependencies
 */
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { privateApis as routerPrivateApis } from '@wordpress/router';

/**
 * Internal dependencies
 */
import { unlock } from '../../private-apis';
import { currentlyPreviewingTheme } from '../../utils/is-previewing-theme';

const { useHistory, useLocation } = unlock( routerPrivateApis );

export default function Themes() {
	const history = useHistory();
	const location = useLocation();
	const { allThemes } = useSelect( ( select ) => {
		return {
			allThemes: select( coreStore ).getAllThemes() || [],
		};
	}, [] );

	return (
		<select
			onChange={ ( event ) => {
				history.push( {
					...location.params,
					theme_preview: event.target.value,
				} );
				window.location.reload();
			} }
			value={ currentlyPreviewingTheme() }
		>
			{ allThemes
				.filter( ( theme ) => theme.block_theme )
				.map( ( theme ) => {
					return (
						<option
							value={ theme.stylesheet }
							key={ theme.stylesheet }
						>
							{ theme.name.rendered }
						</option>
					);
				} ) }
		</select>
	);
}

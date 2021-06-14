/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useBlockProps } from '@wordpress/block-editor';
import { _x } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

const preventDefault = ( event ) => event.preventDefault();

export default function HomeEdit( { context, clientId } ) {
	const { homeUrl } = useSelect(
		( select ) => {
			const {
				getUnstableBase, //site index
			} = select( coreStore );
			return {
				homeUrl: getUnstableBase()?.home,
			};
		},
		[ clientId ]
	);

	const { textColor, backgroundColor, style } = context;
	const blockProps = useBlockProps( {
		className: classnames( {
			'has-text-color': !! textColor || !! style?.color?.text,
			[ `has-${ textColor }-color` ]: !! textColor,
			'has-background': !! backgroundColor || !! style?.color?.background,
			[ `has-${ backgroundColor }-background-color` ]: !! backgroundColor,
		} ),
		style: {
			color: style?.color?.text,
			backgroundColor: style?.color?.background,
		},
	} );

	return (
		<>
			<li { ...blockProps }>
				<a
					className="wp-block-home-link__content"
					href={ homeUrl }
					onClick={ preventDefault }
				>
					{ _x(
						'Home',
						'Label for a link that points at the website home, home_url()'
					) }
				</a>
			</li>
		</>
	);
}

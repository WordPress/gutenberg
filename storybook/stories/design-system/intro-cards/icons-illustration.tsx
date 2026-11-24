import {
	Icon,
	bell,
	calendar,
	check,
	cog,
	comment,
	globe,
	home,
	image,
	link as linkIcon,
	lock,
	media,
	page,
	pencil,
	plus,
	search,
	starFilled,
	tag,
	trash,
} from '@wordpress/icons';
import { Illustration } from './illustration';
import { brand, surface, foreground, muted, r } from './palette';

const glyphs = [
	pencil,
	plus,
	trash,
	cog,
	image,
	page,
	home,
	search,
	starFilled,
	check,
	comment,
	linkIcon,
	tag,
	calendar,
	lock,
	media,
	bell,
	globe,
];

/** A grid of real icons from the library. */
export const IconsIllustration = () => (
	<Illustration>
		{ glyphs.map( ( glyph, i ) => {
			const x = 44 + ( i % 6 ) * 40;
			const y = 24 + Math.floor( i / 6 ) * 40;
			return (
				<g key={ i } transform={ `translate(${ x } ${ y })` }>
					<rect
						width="32"
						height="32"
						style={ r.sm }
						fill={ surface }
						stroke={ muted }
					/>
					<g
						transform="translate(4 4)"
						style={ { color: i === 3 ? brand : foreground } }
					>
						<Icon icon={ glyph } size={ 24 } />
					</g>
				</g>
			);
		} ) }
	</Illustration>
);

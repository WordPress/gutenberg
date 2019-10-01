/**
 * Internal dependencies
 */
import component from './component';
/**
 * External dependencies
 */
import { color, space, layout, flexbox, background, border, position, shadow }
	from 'styled-system';

const Box = component`
  ${ color }
  ${ space }
  ${ layout }
  ${ flexbox }
  ${ background }
  ${ border }
  ${ position }
  ${ shadow }
`;

export default Box;

/**
 * Internal dependencies
 */
import { withMultiBlockSupport } from '../block-controls/multi-block-controls';
import AlignmentToolbar from './';

const MultiBlockAlignmentToolbar = withMultiBlockSupport( AlignmentToolbar, 'align' );

export default MultiBlockAlignmentToolbar;

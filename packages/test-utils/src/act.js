/**
 * External dependencies
 */
import { act } from '@testing-library/react';

/**
 * Simply calls ReactDOMTestUtils.act(cb) If that's not available (older version of react)
 * then it simply calls the given callback immediately.
 *
 * @see https://testing-library.com/docs/react-testing-library/api#act
 * @see https://reactjs.org/docs/test-utils.html#act
 */
export default act;

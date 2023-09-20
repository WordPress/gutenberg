// npm run test:unit -- packages/block-library/src/button

import React from 'react';
import { render } from '@testing-library/react';
import ButtonEdit from '../edit'; // Import your ButtonEdit component

// Mock the setAttributes function
const mockSetAttributes = jest.fn();

describe('ButtonEdit Component', () => {
  it('should update link attributes correctly', () => {
    const attributes = {
      // Initialize your attributes as needed for the test
    };

    const { updateLinkAttributes } = render(
      <ButtonEdit
        attributes={attributes}
        setAttributes={mockSetAttributes}
        // Add other required props here
      />
    );

    // Call the updateLinkAttributes method with desired arguments
    updateLinkAttributes('newURL', true, true);

    // Assert that setAttributes was called with the expected parameters
    expect(mockSetAttributes).toHaveBeenCalledWith({
      url: 'newURL',
      linkTarget: 'new_tab_target_value', // Replace with your expected value
      rel: 'rel_value', // Replace with your expected value
    });
  });
});

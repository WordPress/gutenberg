name: Bug report
description: Report a bug with the WordPress block editor or Gutenberg plugin
labels: ['[Type] Bug']
body:
    - type: markdown
      attributes:
          value: |
              Thanks for taking the time to fill out this bug report! If this is a security issue, please report it in HackerOne instead: https://hackerone.com/wordpress
    - type: textarea
      attributes:
          label: Description
          description: Please write a brief description of the bug, including what you expect to happen and what is currently happening.
          placeholder: |
              Feature '...' is not working properly. I expect '...' to happen, but '...' happens instead
      validations:
          required: true

    - type: textarea
      attributes:
          label: Step-by-step reproduction instructions
          description: Please write the steps needed to reproduce the bug.
          placeholder: |
              1. Go to '...'
              2. Click on '...'
              3. Scroll down to '...'
      validations:
          required: true

    - type: textarea
      attributes:
          label: Screenshots, screen recording, code snippet
          description: |
              If possible, please upload a screenshot or screen recording which demonstrates the bug. You can use LIEcap to create a GIF screen recording: https://www.cockos.com/licecap/
              Tip: You can attach images or log files by clicking this area to highlight it and then dragging files in.
              If this bug is to related to a developer API, please share a code snippet that demonstrates the issue. For small snippets paste it directly here, or you can use GitHub Gist to share multiple code files: https://gist.github.com
              Please ensure the shared code can be used by a developer to reproduce the issue—ideally it can be copied into a local development environment or executed in a browser console to help debug the issue
      validations:
          required: false

    - type: textarea
      attributes:
          label: Environment info
          description: |
              Please list what Gutenberg version you are using. If you aren't using Gutenberg, please note that it's not installed.
          placeholder: |
              - WordPress version, Gutenberg version, and active Theme you are using.
              - Browser(s) are you seeing the problem on.
              - Device you are using and operating system (e.g. "Desktop with Windows 10", "iPhone with iOS 14", etc.).
      validations:
          required: false

    - type: checkboxes
      id: existing
      attributes:
          label: Please confirm that you have searched existing issues in the repo.
          description: You can do this by searching https://github.com/WordPress/gutenberg/issues and making sure the bug is not related to another plugin.
          options:
              - label: 'Yes'
                required: true

    - type: checkboxes
      id: plugins
      attributes:
          label: Please confirm that you have tested with all plugins deactivated except Gutenberg.
          options:
              - label: 'Yes'
                required: true

    - type: checkboxes
      id: themes
      attributes:
          label: Please confirm which theme type you used for testing.
          options:
              - label: 'Block'
              - label: 'Classic'
              - label: 'Hybrid (e.g. classic with theme.json)'
              - label: 'Not sure'

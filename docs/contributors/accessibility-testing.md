# Accessibility Testing

This is a guide on how to test accessibility on Gutenberg. This is a living document that can be improved over time with new approaches and techniques.

## Getting Started

Make sure you have set up your local environment following the instructions on [Getting Started](/docs/contributors/getting-started.md).

## Keyboard Testing

In addition to mouse, make sure the interface is fully accessible for keyboard-only users. Try to interact with your changes using only the keyboard:

- Make sure interactive elements can receive focus using <kbd>Tab</kbd>, <kbd>Shift+Tab</kbd> or arrow keys.
- Buttons should be activable by pressing <kbd>Enter</kbd> and <kbd>Space</kbd>.
- Radio buttons and checkboxes should be checked by pressing <kbd>Space</kbd>, but not <kbd>Enter</kbd>.

If the elements can be focused using arrow keys, but not <kbd>Tab</kbd> or <kbd>Shift+Tab</kbd>, consider grouping them using one of the [WAI-ARIA composite subclass roles](https://www.w3.org/TR/wai-aria-1.1/#composite), such as [`toolbar`](https://www.w3.org/TR/wai-aria-1.1/#toolbar), [`menu`](https://www.w3.org/TR/wai-aria-1.1/#menu) and [`listbox`](https://www.w3.org/TR/wai-aria-1.1/#listbox).

If the interaction is complex or confusing to you, consider that it's also going to impact keyboard-only users.

## Screen Reader Testing

According to the [WebAIM: Screen Reader User Survey #8 Results](https://webaim.org/projects/screenreadersurvey8/#usage), these are the most common screen reader and browser combinations:

| Screen Reader & Browser     | # of Respondents | % of Respondents |
|-----------------------------|------------------|------------------|
| JAWS with Chrome            | 259              | 21.4%            |
| NVDA with Firefox           | 237              | 19.6%            |
| NVDA with Chrome            | 218              | 18.0%            |
| JAWS with Internet Explorer | 139              | 11.5%            |
| VoiceOver with Safari       | 110              | 9.1%             |
| JAWS with Firefox           | 71               | 5.9%             |
| VoiceOver with Chrome       | 36               | 3.0%             |
| NVDA with Internet Explorer | 14               | 1.2%             |
| Other combinations          | 126              | 10.4%            |

When testing with screen readers, try to use some of the combinations at the top of this list. For example, when testing with VoiceOver, it's preferrable to use Safari.

### VoiceOver with Safari

[VoiceOver](https://support.apple.com/guide/voiceover-guide/welcome/web) is the native screen reader on macOS. You can enable it on System Preferences > Accessibility > VoiceOver > Enable VoiceOver or by quickly pressing Touch ID three times while holding the Command key.

![macOS accessibility preferences panel](https://user-images.githubusercontent.com/3068563/107645175-2560fd80-6c57-11eb-9e07-365c798869d8.png)

While in the Gutenberg editor, with VoiceOver activated, you can press <kbd>Control+Option+U</kbd> to open the Rotor and find more easily the different regions and elements on the page. This is also a good way to make sure elements are labelled correctly. If a name on this list doesn't make sense, it should be improved.

![Navigating through form controls and landmarks using the VoiceOver Rotor](https://user-images.githubusercontent.com/3068563/107646280-8e954080-6c58-11eb-8481-72e051d73973.gif)

Prefer to select a region or another larger area to begin with instead of individual elements on the Rotor so you can better test the navigation within that region.

Once you find the region you want to interact with, you can use <kbd>Control+Option</kbd> plus right or left arrow keys to move to the next or previous elements on the page. Then, follow the instructions that VoiceOver will announce.
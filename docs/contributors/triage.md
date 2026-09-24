# Triage

To keep the repository healthy, it needs to be triaged regularly. **Triage is the practice of reviewing existing issues and pull requests to make sure they’re relevant, actionable, and have all the information they need**. Anyone can help triage, although you’ll need to be a member of the triage team for the Gutenberg repository to modify an issue’s labels or edit its title.

> Besides this page, the [How to do triage on GitHub](https://learn.wordpress.org/tutorial/how-to-do-triage-on-github/) tutorial is another great resource to get introduced to triage

## Join the triage team

The triage team is an open group of people with a particular role of making sure triage is done consistently across the Gutenberg repo. There are various types of triage which happen:

-   Regular self triage sessions done by members on their own time.
-   Organized triage sessions done as a group at a set time. You can [review the meetings page](https://make.wordpress.org/meetings/) to find these triage sessions and appropriate slack channels.
-   Focused triage sessions on a specific board, label or feature.

These are the expectations of being a triage team member:

-   You are expected to do some triage even if it is self triage at least once a week.
-   As you can, try to join organized triage sessions.
-   If you join the triage team to focus on a specific label or board, the expectation is that your focus will be there. Please make this known to fellow triage team members.

If you would like to join this team, simply ask in #core-editor [Slack](https://make.wordpress.org/chat/) at any time.

## Triage your first issues

To start simply choose from one of these filtered lists below. Note: You can find most of these filters by selecting the “Sort” option from the [overall Issues page](https://github.com/wordpress/gutenberg/issues).

-   **All Gutenberg issues [without an assigned label](https://github.com/WordPress/gutenberg/issues?q=is%3Aopen+is%3Aissue+no%3Alabel+sort%3Aupdated-asc)**. Triaging by simply adding labels helps people focused on certain aspects of Gutenberg find relevant issues easier and start working on them.
-   **All Gutenberg pull requests [without an assigned label](https://github.com/WordPress/gutenberg/pulls?q=is%3Aopen+is%3Apr+no%3Alabel)**. This requires a level of comfortability with code. For more guidance on which labels are best to use, please [review this section on labeling pull requests](/docs/contributors/repository-management.md#pull-requests) for contributors. You can also always check with the person authoring the pull request to make sure the labels match what they are intending to do.
-  **[The least recently updated](https://github.com/WordPress/gutenberg/issues?q=is%3Aopen+is%3Aissue+sort%3Aupdated-asc) Gutenberg issues**. Triaging issues that are getting old and possibly out of date keeps important work from being overlooked.
-  **All Gutenberg issues [with no comments](https://github.com/wordpress/gutenberg/issues?q=is%3Aissue+is%3Aopen+comments%3A0+)**. Triaging this list helps make sure all issues are acknowledged, and can help identify issues that may need more information or discussion before they are actionable.
-  **[The least commented](https://github.com/wordpress/gutenberg/issues?q=is%3Aissue+is%3Aopen+sort%3Acomments-asc) on Gutenberg issues**. Triaging this list helps the community figure out what things might still need traction for certain proposals.
-  **[The most commented](https://github.com/wordpress/gutenberg/issues?q=is%3Aissue+is%3Aopen+sort%3Acomments-desc) on Gutenberg issues**. If you feel comfortable chiming in and the conversation has stagnated, the best way to triage these kinds of issues is to summarize the discussion thus far and do your best to identify action items, blockers, etc. Triaging this list allows finding solutions to important and complex issues to move forward.
-  You can also **create your own custom set of filters on GitHub**. If you have a filter you think might be useful for the community, feel free to submit a PR to add it to this list.

## General triage process

When triaging, either one of the lists above or issues in general, work through issues one-by-one. Here are some steps you can perform for each issue:

1. First **search for duplicates**. If the issue is duplicate, close it by commenting with “Duplicate of #” and add any relevant new details to the existing issue. (Don’t forget to search for duplicates among closed issues as well!).
2. If the **issue is missing labels, add some** to better categorize it (requires proper permissions given after joining the triage team). A good starting place when adding labels is to apply one of the labels prefixed [Type] (e.g. [Type] Enhancement or [Type] Bug) to indicate what kind of issue it is. After that consider adding more descriptive labels. If the issue concerns a particular core block, add one of the labels prefixed [Block]. Or if the issue affects a particular feature there are [Feature] labels. Finally, there are labels that affect particular interest areas, like Accessibility and Internationalization. You can view all possible labels [here](https://github.com/WordPress/gutenberg/labels).
3. If the **title doesn’t communicate the issue clearly enough, edit it for clarity** (requires proper permissions). Specifically, we’d recommend having the main feature the issue relates to in the beginning of the title ([example](https://github.com/WordPress/gutenberg/issues/6193)) and for the title to generally be as succinct yet descriptive as possible ([example](https://github.com/WordPress/gutenberg/issues/6193)).
4. If it’s a **bug report, test to confirm the report or add the `Needs Testing` label**. If there is not enough information to confirm the report, add the `[Status] Needs More Info` label and ask for the details needed. It’s particularly beneficial when a bug report has steps for reproduction so ask the reporter to add those if they’re missing.
5. **Remove the `[Status] Needs More Info` when is no longer needed**, for example if the author of the issue has responded with enough details.
6. **Close the inactive `[Status] Needs More Info` issues with a note** if the author didn't respond in 2+ weeks.
7. If there was a conversation on the issue but **no actionable steps identified, follow up with the participants to see what’s actionable**. Make sure to @ each participant when responding in a comment.
8. If you feel comfortable triaging the issue further, then you can also:
    - Check that the bug report is valid by debugging it to see if you can track down the technical specifics.
    - Check if the issue is missing some detail and see if you can fill in those details. For instance, if a bug report is missing visual detail, it’s helpful to reproduce the issue locally and upload a screenshot or GIF.
    - Consider adding the Good First Issue label if you believe this is a relatively easy issue for a first-time contributor to try to solve.

**Commonly used labels**

Generally speaking, the following labels are very useful for triaging issues and will likely be the ones you use the most consistently. You can view all possible labels [here](https://github.com/WordPress/gutenberg/labels).

| Label                      | Reason                                                                                    |
| -------------------------- | ----------------------------------------------------------------------------------------- |
| `[Type] Bug`               | When an intended feature is broken.                                                       |
| `[Type] Enhancement`       | When someone is suggesting an enhancement to a current feature.                           |
| `[Type] Help Request`      | When someone is asking for general help with setup/implementation.                        |
| `Needs Technical Feedback` | When you see new features or API changes proposed.                                        |
| `Needs More Info`          | When it’s not clear what the issue is or it would help to provide additional details.     |
| `Needs Testing`            | When a new issue needs to be confirmed or old bugs seem like they are no longer relevant. |

**Determining priority labels**

If you have enough knowledge about the report at hand and feel confident in doing so, you can consider adding priority. Note that it’s on purpose that no priority label infers a normal level.

| Label                | Reason                                                                                                                                                                                                                                                     |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Priority: High`     | Fits one of the current focuses and is causing a major broken experience (including flow, visual bugs and blocks).                                                                                                                                         |
| `Priority: Low`      | Enhancements that aren’t part of focuses, niche bugs, problems with old browsers.                                                                                                                                                                          |

## Closing issues

Issues are closed for the following reasons:

-   A PR and/or latest release resolved the reported issue.
-   Duplicate of a current report.
-   Help request that is best handled in the WordPress.org forums.
-   An issue that's not able to be replicated.
-   An issue that needs more information that the author of the issue hasn't responded to for 2+ weeks.
-   An item that is determined as unable to be fixed or is working as intended.

## Specific triages

### Release specific triage

Here are some guidelines to follow when doing triage specifically around the time of a release. This is important to differentiate compared to general triage so problematic, release blocking bugs are properly identified and solutions are found.

-  **If a bug is introduced in a release candidate (RC) and it's going to break many workflows**, add it to the version milestone and flag in the [#core-editor](https://wordpress.slack.com/archives/C02QB2JS7) channel in WordPress.org slack.
-  **If a bug was introduced in the most recent version, and a next RC hasn’t yet happened**, ideally the developers can push to fix it prior to RC! The amount of push for a fix should scale proportional to the potential of breakage. In this case, add to the RC milestone and, if deemed urgent, ping in the [#core-editor](https://wordpress.slack.com/archives/C02QB2JS7) channel in WordPress.org slack.
-  **If a bug wasn’t introduced in the most recent version**, do not add a milestone. Instead, use labels like `[Priority] High` if it’s a pressing issue, and if needed you can call attention to it in the weekly core meetings.

### Design specific triage

Along with the general triage flows listed previously, there are some specific additions to the flows for more design-centric triage for design minded folks participating in triage.

-   PR testing and reviews: this should be your first stop for daily self triage.
-  Label `Needs Design Feedback`: check if the issue does need design feedback and, if possible, give it. You can organize this by priority, project boards or by least commented. Once there are enough opinions, please remove this label and decide on next steps (ie adding the Needs Design label).
- Label  `Needs Design`: Does it really need a design? Does this fit a focus? If it has a design mark as `Needs Design Feedback` to better categorize the issue.

Reminders:

-   Ask for screenshots as needed.
-   Ask for iterations and note any changes before merging.
-   If the issue isn’t in a board, check to see if it doesn’t fit in a specific focus.
-   If the issue/pull has not been prioritized yet, consider adding a priority label to help move the issue forward.

For more detailed information about weekly design triage and to join in, please [review this guide](https://make.wordpress.org/design/handbook/workflows/weekly-gutenberg-design-triage/).

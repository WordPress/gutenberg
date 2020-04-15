## Get involved in triage
To keep the issue list healthy, it needs to be triaged regularly. Triage is the practice of reviewing existing issues to make sure they’re relevant, actionable, and have all the information they need.
Anyone can help triage, although you’ll need to be a member of the triage team for the Gutenberg repository to modify an issue’s labels or edit its title.

## Join the triage team
The triage team is an open group of people with a particular role of making sure triage is done consistently across the Gutenberg repo. There are various types of triage which happen:

* Regular self triage sessions
* Organised triage sessions
* Focusing on a specific board, label or feature to triage

If you would like to join this team, you can through asking in #core-editor Slack at any time.

These are the expectations of being a team member:

* As a member of the triage team, you are expected to at least once a week do some triage even if it is self triage.
* Some people might join this team to focus on a specific label or board, in that case their focus is there.
* Try and join triage sessions.

## Getting started
To start simply choose from one of these filtered lists of issues:

* All Gutenberg issues without an assigned label. Triaging by simply adding labels helps people focused on certain aspects of Gutenberg find relevant issues easier and start working on them.
* The least recently updated Gutenberg issues. Triaging issues that are getting old and possibly out of date keeps important work from being overlooked.
* All Gutenberg issues with no comments. Triaging this list helps make sure all issues are acknowledged, and can help identify issues that may need more information or discussion before they are actionable.
* The least commented on issues Triaging this list helps the community figure out things like traction for certain proposals.
* You can also create your own custom set of filters on GitHub. If you have a filter you think might be useful for the community, feel free to submit a PR to add it to this list.

### Triage itself
When triaging, either one of the lists above or issues in general, work through issues one-by-one. Here are some steps you can perform for each issue:

* First search for duplicates. If the issue is duplicate, close it by commenting with “Duplicate of #” and add any relevant new details to the existing issue. (Don’t forget to search for duplicates among closed issues as well!)
* If the issue is missing labels, add some to better categorize it (requires proper permissions).
 ** A good starting place when adding labels is to apply one of the labels prefixed [Type] (e.g. [Type] Enhancement or [Type] Bug) to indicate what kind of issue it is.
 ** After that consider adding more descriptive labels. If the issue concerns a particular core block, add one of the labels prefixed [Block]. Or if the issue affects a particular feature there are [Feature] labels.
 ** Finally, there are labels that affect particular interest areas, like Accessibility and Internationalization
* Consider adding priority if you can:
 ** Priority OMGWTFBBQ:
   *** Major issues that are causing failures and are reported frequently.
   *** Typically, these are issues that are critical because they break important behaviour or functionality.
   *** An example might be, “Unable to remove a block after it is added to the editor”. .
 ** Priority: High:
   *** Fits one of the current focuses: usually placing in that project board.
   *** Major broken experience (including flow, visual bugs and blocks).
 ** Priority: Low:
   *** Enhancements that aren’t part of focuses.
   *** Niche bugs.
   *** Old browsers
 ** Note that no priority label infers normal.
* If the title doesn’t communicate the issue, edit it for clarity (requires proper permissions).
* If it’s a bug report, test to confirm the report or add the Needs Testing label. If there is not enough information to confirm the report, add the [Status] Needs More Info label and ask for the details needed. It’s particularly beneficial when a bug report has steps for reproduction, ask the reporter to add those if they’re missing.
* Remove the [Status] Needs More Info if the author of the issue has responded with enough details.
* Close the issue with a note if it has a [Status] Needs More Info label but the author didn't respond in 2+ weeks.
* If there was a conversation on the issue but no actionable steps identified, follow up with the participants to see what’s actionable.
* If you feel comfortable triaging the issue further, then you can also:
 ** Check that the bug report is valid by debugging it to see if you can track down the technical specifics.
 ** Check if the issue is missing some detail and see if you can fill in those details. For instance, if a bug report is missing visual detail, it’s helpful to reproduce the issue locally and upload a screenshot or GIF.
 ** Consider adding the Good First Issue label if you believe this is a relatively easy issue for a first-time contributor to try to solve.

For triaging there are some labels which are very useful:
* Needs Technical Feedback - you can apply them when you see new features or API changes proposed
* Needs More Info - when it’s not clear what the issue is or it would help to provide additional details
* Needs Testing - it’s useful for old bugs where it seems like they are no longer relevant

## Design specific triage
Along with the general triage flows listed previously, there are some specific additions to the flows for more design-centric triage:

* PR testing and reviews: ideally this is your first stop, particularly in daily self triage.
* Needs design feedback: check this does need design feedback and if possible give it. You can organise this by priority, project boards or by least commented.
  ** Ask for screenshots to see if unable to.
  ** Ask for iterations and note need to change before merging.
  ** Once enough opinions remove the label and either go to needs design.
  ** If this isn’t in a board, check it doesn’t fit in a specific focus.
  ** If the issue/pull has not been prioritized yet, consider adding a priority.
* Needs design:
  ** Does it really need a design?
  ** Does this fit a focus?
  ** If it has a design mark as ‘needs design feedback’.

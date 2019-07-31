workflow "Milestone merged pull requests" {
  on = "pull_request"
  resolves = ["Milestone It"]
}

action "Milestone It" {
  uses = "./.github/actions/milestone-it"
  secrets = ["GITHUB_TOKEN"]
}

workflow "Assign fixed issues when pull request opened" {
  on = "pull_request"
  resolves = ["Assign Fixed Issues"]
}

action "Filter opened" {
  uses = "actions/bin/filter@0dbb077f64d0ec1068a644d25c71b1db66148a24"
  args = "action opened"
}

action "Assign Fixed Issues" {
  uses = "./.github/actions/assign-fixed-issues"
  needs = ["Filter opened"]
  secrets = ["GITHUB_TOKEN"]
}

workflow "Add the First-time Contributor label to PRs opened by first-time contributors" {
  on = "pull_request"
  resolves = ["First Time Contributor"]
}

action "First Time Contributor" {
  uses = "./.github/actions/first-time-contributor"
  needs = ["Filter opened"]
  secrets = ["GITHUB_TOKEN"]
}

workflow "Milestone merged pull requests" {
  on = "pull_request"
  resolves = ["Milestone It"]
}

action "Filter merged" {
  uses = "actions/bin/filter@3c0b4f0e63ea54ea5df2914b4fabf383368cd0da"
  args = "merged true"
}

action "Milestone It" {
  uses = "./.github/actions/milestone-it"
  needs = ["Filter merged"]
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

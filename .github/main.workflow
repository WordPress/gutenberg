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

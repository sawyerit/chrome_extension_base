import { assert } from 'chai'
import fixtures from './fixtures'
import $ from 'jquery'
import JiraResultsRenderer from '../src/js/lib/JiraResultsRenderer'

context("rendering", function() {

  it("should properly render issues from object", function() {

    var issuesObject = JSON.parse(fixtures.query)
    var firstIssue = issuesObject.issues[0]

    var $rendered = $('<div>' + JiraResultsRenderer.renderIssues(issuesObject) + '</div>')

    assert.lengthOf($rendered.find('.issue-card'), issuesObject.issues.length)
    assert.lengthOf($rendered.find(`[data-issue-id=${firstIssue.id}]`), 1)
    assert.equal($rendered.find('.issue-key').first().text().trim(), firstIssue.key.trim())
    assert.equal($rendered.find('.issue-summary').first().text().trim(), firstIssue.fields.summary.trim())

  })

  it("should properly render activities from feed object", function() {

    var parsedFeed = (new window.DOMParser()).parseFromString(fixtures.feed, "text/xml")
    var $rendered = $(JiraResultsRenderer.renderFeed(parsedFeed))

    let entries = parsedFeed.getElementsByTagName('feed')[0].getElementsByTagName("entry");

    assert.lengthOf($rendered.find('li'), entries.length)
  })
})

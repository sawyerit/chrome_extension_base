# Workiva Denver Code Challenge

Solution

Time spent: ~10 hours

## My thoughts

### Some decisions I made

#### Modular

One of the things I love about writing javascript these days is that I can encapsulate things. I had worked with JS developers in the past that would use closures as semi-encapsulated code organization, and I liked that at the time, but JS is all grown up now. Let's make some modules!!

I ended up with pretty DRY and hopefully readable code. And I got the `main` file down to 50 lines without obscuring too much of the logic.

#### Funky singleton-like request class

My `JiraApiRequest` class came out a little funky. Lots of getters. I'm not sure I've written a class like that before. It all came from the interface I wanted. To me, the URLs and paths are all data. So it didn't make sense for them to be methods. But they needed runtime logic to pull from the DOM. So, I end up with a bunch of getters. And also some properties that I just set in the constructor, because they won't be affected by user input.

I'm also not totally sure how JS handles real singletons, or if it does at all. Probably could have googled that, but what I have isn't too bad.

#### No Libraries

Except for webpack and testing. The production code has no dependencies.

I'm usually a big fan of dependencies. Why duplicate work? However, when I got into the code, it seemed intentional that jQuery was not used for DOM traversal and manipulation. Also, since I've started my current job, our front-end instructors deliberately teach DOM and AJAX without jQuery, so I've learned it, and I figured I'd use it.

I also considered a templating or view library, or even backbone, but since I wasn't using jQuery, and there's only two render functions anyway, I figured I'd just write some multi-line strings and put them in a render class.

#### fetch

It's just so much easier than `XMLHttpResponse`. And I know async/await is the new hotness, but I haven't had the chance to really get used to the workflow, so I just went with promises. You can see I like the procedural style of promise chaining.

#### Styling

I'm no css master by any means, but I wanted to at least get a little styling in there to establish that I'm not afraid of it.

#### Tests

We all need more of them, so I threw a couple in. I've tried using selenium for real integration test a few times, and it's just such a hassle. It wouldn't have sped up my feedback loop on a small project like this, so it's only mildly unit tested.

Also, as much as I see the value in test driving, I was really excited about getting in and modularizing it, and admittedly, the tests came last 😳.

### Thoughts on the challenge

#### Chrome extension

I like challenges that use sort of obscure technologies. You can try to hire people that know the technologies you use, or you can hire people that can teach themselves technologies. Now, it turned out a chrome extension was easier to get up an running than I thought, but it's probably the right balance as to avoid false negatives.

#### Inconsistent style

I like that it forces you to A) know different ways to do the same thing in JS and B) make some decisions about which is the right style. I also found that there was some inconsistency in the UX. The "Query" button would give you detailed status as the AJAX request was working, but the feed would not. When playing with my work, I immediately recognized the cognitive dissonance, and set to fix it. That cognitive dissonance also occurs in the code, when you aren't consistent in style.

#### Work simulation (or lack thereof)

The hardest thing about hiring is getting someone in their natural work environment, before they're in the work environment. This job is about so much more than just coding. I've never seen a take home code challenge that really recreates the job. I guess it's intended as more of a filter and conversation starter anyway.

I found myself making idealistic choices during this challenge. I was excited about the small scope. It allowed me to make decisions that I might on a greenfield project, without having to really deal with any legacy code, nor live with those decisions for long. However, legacy code is something we all deal with (except maybe [Chad Fowler](https://www.youtube.com/watch?v=-UKEPd2ipEk)). I know that I wouldn't have been able to completely rework the bones of this thing if I were on the job. And when I sent an email asking if I could, it was really only to communicate that I know that.

I also found myself giving up on reasonable git workflow, since you didn't want a PR anyway 😜.

## Developer Docs

### Getting started

1. Clone the repository.
2. Install [yarn](https://yarnpkg.com): `npm install -g yarn`.
3. Run `yarn`.
6. Run `yarn start`
7. Load your extension on Chrome following:
    1. Access `chrome://extensions/`
    2. Check `Developer mode`
    3. Click on `Load unpacked extension`
    4. Select the `build` folder.
8. Have fun.

### Running tests

1. Run `yarn start` or `yarn run build`
2. Open `build/test.html`

### Tools Used

- [Webpack](https://webpack.github.io/docs) - for modularizing JavaScript
- [Chrome Extension Webpack Boilerplate](https://github.com/samuelsimoes/chrome-extension-webpack-boilerplate) - Just so I didn't have to do all the configuration of webpack from scratch. I only had to customize things a little bit.
- [Mocha](https://mochajs.org) - A classic JS test runner
- [Chai](http://chaijs.com/) - A good JS assertion library

### Usage

Click the extension icon in your browser to start.

#### Query for issues

1. Under "Ticket Status Query", type the name of your project. Defaults to "Sunshine".
2. Select what status of issues you're searching for. Your options are "Open" or "In Progress". Defaults to "Open".
3. Enter the number of days for the max age of issues you're searching for. Defaults to 5.
4. Click "Query"

A list of issues matching your criteria will appear below.

#### Get latest user activity

1. Under "Jira Activity Query", enter the user name you'd like to get activity for.
2. Click "Get Jira Activity"

A list of recent activity for that user will appear below.
